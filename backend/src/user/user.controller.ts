import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGaurd } from 'src/auth/Jwt.auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/OptionalJwt.auth.guard';
import { type Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @UseGuards(JwtGaurd)
  @Get('getall')
  findAll() {
    return this.userService.findAll();
  }

  //edit profile
  @UseGuards(JwtGaurd)
  @Patch("profile")
  @UseInterceptors(FileInterceptor("profilePicture"))
  updateProfile(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const user = req.user as any;

    return this.userService.updateProfile(
      user.id,
      updateProfileDto,
      file,
    );
  }


  @UseGuards(JwtGaurd)
  @Get('profile')
  getProfile(@Req() req: Request) {
    const user = req.user as any;
    return this.userService.getProfile(user.id);
  }

  

  @UseGuards(OptionalJwtAuthGuard)
  @Get(":id")
  getUserProfile(
    @Param("id") id: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.userService.getUserProfile(
      id,
      user?.id || null,
    );
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
