import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';

import { JwtGaurd } from 'src/auth/Jwt.auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/OptionalJwt.auth.guard';
import { CreateCommentDto } from './dto/comment.dto';
import { type Request } from 'express';
import { UpdateCommentDto } from './dto/updateComment.dto';

@Controller('comment')
export class CommentController {

  constructor(private readonly commentService: CommentService) {}

  @Get('/:postId')
  @UseGuards(OptionalJwtAuthGuard)
  getComment(
    @Param('postId') postId:string,@Req() req:Request){
      const user = req.user as any;
      return this.commentService.getAllComment(postId, user?.id || null);
  }

 @Post('/:postId')
 @UseGuards(JwtGaurd)
 createcomment(
  @Param('postId') postId:string,@Body() createCommentDto:CreateCommentDto,@Req() Req:Request,
 ){
  const user=Req.user as any
   return this.commentService.createComment(
    postId,user.id,createCommentDto,
   )
 }

 @Patch(':commentId')
@UseGuards(JwtGaurd)
editComment(
  @Param('commentId') commentId: string,
  @Body() updateCommentDto: UpdateCommentDto,
  @Req() req: Request,
) {
  const user = req.user as any;

  return this.commentService.editComment(
    commentId,
    user.id,
    updateCommentDto,
  );
}
  
 @Delete('/:commentId')
 @UseGuards(JwtGaurd)
 deletecomment(@Req() Req:Request,@Param('commentId') commentId:string){
  
  const user=Req.user as any 
  return this.commentService.deleteComment(
   commentId,  user.id,
  )
 }

}
