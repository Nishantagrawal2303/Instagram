import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { PostEntity } from 'src/post/entities/post.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FollowEntity } from 'src/follow/entities/follow.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
     @InjectRepository(PostEntity)
  private readonly postRepository: Repository<PostEntity>,

  private readonly cloudinaryService: CloudinaryService,
  @InjectRepository(FollowEntity)
private readonly followRepository: Repository<FollowEntity>,
  ) {}

  // Create User
  async createUser(createUserDto: CreateUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (user) {
      throw new BadRequestException(
        'User with this email already exists',
      );
    }

    const newUser = this.userRepository.create(createUserDto);
    return await this.userRepository.save(newUser);
  }

  async updateProfile(
  userId: string,
  updateProfileDto: UpdateProfileDto,
  file?: Express.Multer.File,
) {
  const user = await this.findOne(userId);

  // Update name if provided
  if (updateProfileDto.name !== undefined) {
    user.name = updateProfileDto.name;
  }

  // Update bio if provided
  if (updateProfileDto.bio !== undefined) {
    user.bio = updateProfileDto.bio;
  }

  // Update profile picture if uploaded
  if (file) {
    // Delete old image from Cloudinary
    if (user.profilePicturePublicId) {
      await this.cloudinaryService.deleteImage(
        user.profilePicturePublicId,
      );
    }

    // Upload new image
    const uploadedImage =
      await this.cloudinaryService.uploadImage(file);

    user.profilePicture = uploadedImage.secure_url;
    user.profilePicturePublicId = uploadedImage.public_id;
  }

  await this.userRepository.save(user);

  return {
  message: "Profile updated successfully",
  user: {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  },
};
}

async getUserProfile(
  id: string,
  currentUserId: string,
) {
  const user = await this.userRepository.findOne({
    where: {
      id,
    },
  });

  if (!user) {
    throw new NotFoundException("User not found");
  }


  const posts = await this.postRepository.count({
    where: {
      user: {
        id: user.id,
      },
    },
  });


  const followers = await this.followRepository.count({
    where: {
      following: {
        id: user.id,
      },
    },
  });


  const following = await this.followRepository.count({
    where: {
      follower: {
        id: user.id,
      },
    },
  });


  let isFollowing = false;
  if (currentUserId) {
    const followRecord = await this.followRepository.findOne({
      where: {
        follower: {
          id: currentUserId,
        },
        following: {
          id: user.id,
        },
      },
    });
    isFollowing = !!followRecord;
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    profilePicture: user.profilePicture,
    

    posts,
    followers,
    following,
    
    isFollowing,
    isOwner: Boolean(currentUserId && currentUserId === user.id),
  };
}

  // Get All Users
  async findAll() {
    return await this.userRepository.find();
  }

  // Get Single User
  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getProfile(userId: string) {
  const user = await this.userRepository.findOne({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  const posts = await this.postRepository.count({
    where: {
      user: {
        id: userId,
      },
    },
  });

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    profilePicture: user.profilePicture,
    posts,
    followers: 0,
    following: 0,
    isOwner:user.id==userId?true:false
  };
}

  // ye to update user ke liye 
  async update(id: string, updateUserDto: UpdateUserDto) {

    // yaha to user check kiya kiya ki user exist karta hai ya nahi
    const user = await this.findOne(id);

    // Email duplicate check karne ke liye 
    if (
      updateUserDto.email &&
      updateUserDto.email !== user.email
    ) {
      
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException(
          'User with this email already exists',
        );
      }
    }

    Object.assign(user, updateUserDto);

    return await this.userRepository.save(user);
  }

  // Delete User
  async remove(id: string) {
    const user = await this.findOne(id);

    await this.userRepository.remove(user);

    return {
      message: 'User deleted successfully',
    };
  }
}