import { Body, Controller, Param, Post, Req, UploadedFiles, UseGuards, UseInterceptors,Delete, Get } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/createPost.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtGaurd } from 'src/auth/Jwt.auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/OptionalJwt.auth.guard';
import { type Request } from 'express';
import { Multer } from 'multer';



@Controller('post')
export class PostController {

constructor(private readonly postservice:PostService){}

@Get("getallPost")
@UseGuards(OptionalJwtAuthGuard)
getAllPost(@Req() req: Request){
  const user = req.user as any;
  return this.postservice.getAllPost(user?.id || null);
}

@Post("create")
@UseGuards(JwtGaurd)
@UseInterceptors(FilesInterceptor('images', 3))
createPost(
  @UploadedFiles() files: Express.Multer.File[],
  @Body() createPostDto: CreatePostDto,@Req() req:Request
  
) {  

  const user=req.user as any
  return this.postservice.create(createPostDto, files,user.id);
}


@UseGuards(OptionalJwtAuthGuard)
@Get("user/:id")
getUserPosts(
  @Param("id") userId: string,
) {
  return this.postservice.getUserPosts(userId);
}
@UseGuards(JwtGaurd)
@Get("my-posts")
getMyPosts(@Req() req: Request) {
  const user = req.user as any;
  return this.postservice.getMyPosts(user.id);
}

@UseGuards(JwtGaurd)
@Delete('deletepost')
async deletePost(
  @Body() body :{postId: string},
  @Req() req: Request,
) {
  const user=req.user as any 
  return this.postservice.delete(
    body.postId,
    user.id,
  );
}
    }

