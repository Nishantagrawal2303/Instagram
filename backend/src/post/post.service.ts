import { Injectable, NotFoundException,ForbiddenException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Express } from 'express';

import { PostEntity } from './entities/post.entity';
import { UserEntity } from 'src/user/entities/user.entity';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { CreatePostDto } from './dto/createPost.dto';
import { LikeEntity } from 'src/like/entity/like.entity';
import { CommentEntity } from 'src/comment/entity/comment.entity';
import { FollowEntity } from 'src/follow/entities/follow.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}


async getAllPost(currentUserId: string) {
  const posts = await this.postRepository
    .createQueryBuilder("post")
    .leftJoin("post.user", "user")
    .select([
      "post.id",
      "post.caption",
      "post.images",
      "post.createdAt",
      "user.id",
      "user.name",
      "user.username",
    ])

    .addSelect((qb) => {
      return qb
        .select("COUNT(*)")
        .from(LikeEntity, "like")
        .where("like.post.id = post.id");
    }, "likeCount")

    .addSelect((qb) => {
      return qb
        .select("COUNT(*)")
        .from(CommentEntity, "comment")
        .where("comment.post.id = post.id");
    }, "commentCount")

    .addSelect((qb) => {
      const sub = qb
        .select("COUNT(*)")
        .from(FollowEntity, "follow");
      if (currentUserId) {
        return sub
          .where("follow.follower.id = :currentUserId")
          .andWhere("follow.following.id = user.id");
      }
      return sub.where("1 = 0");
    }, "isFollowing")

    .setParameter("currentUserId", currentUserId || "00000000-0000-0000-0000-000000000000")

    .getRawMany();

  return posts.map((post) => ({
    post_id: post.post_id,
    post_caption: post.post_caption,
    post_images: post.post_images,
    post_createdAt: post.post_createdAt,

    user_id: post.user_id,
    user_name: post.user_name,
    user_username: post.user_username,

    likeCount: Number(post.likeCount),
    commentCount: Number(post.commentCount),

    isFollowing: currentUserId ? Number(post.isFollowing) > 0 : false,
    isOwner: currentUserId ? post.user_id === currentUserId : false,
  }));
}

async getUserPosts(userId: string) {

  const posts = await this.postRepository
    .createQueryBuilder("post")

    .leftJoin("post.user", "user")

    .select([
      "post.id",
      "post.caption",
      "post.images",
      "post.createdAt",
      
      "user.id",
      "user.name",
      "user.username",
    ])
    .addSelect((qb) => {
      return qb
        .select("COUNT(*)")
        .from(LikeEntity, "like")
        .where("like.post.id = post.id");
    }, "likeCount")

    .addSelect((qb) => {
      return qb
        .select("COUNT(*)")
        .from(CommentEntity, "comment")
        .where("comment.post.id = post.id");
    }, "commentCount")


    .where("user.id = :userId", {
      userId,
    })

    .orderBy(
      "post.createdAt",
      "DESC",
    )

    .getRawMany();


  return posts.map((post) => ({
    post_id: post.post_id,
    post_caption: post.post_caption,
    post_images: post.post_images,
    post_createdAt: post.post_createdAt,
    likeCount: Number(post.likeCount),
    commentCount: Number(post.commentCount),
    user_id: post.user_id,
    user_name: post.user_name,
    user_username: post.user_username,
  }));
}
async getMyPosts(currentUserId: string) {
  const posts = await this.postRepository
    .createQueryBuilder("post")
    .leftJoin("post.user", "user")
    .select([
      "post.id",
      "post.caption",
      "post.images",
      "post.createdAt",
      "user.id",
      "user.name",
      "user.username",
    ])

    .addSelect((qb) => {
      return qb
        .select("COUNT(*)")
        .from(LikeEntity, "like")
        .where("like.post.id = post.id");
    }, "likeCount")

    .addSelect((qb) => {
      return qb
        .select("COUNT(*)")
        .from(CommentEntity, "comment")
        .where("comment.post.id = post.id");
    }, "commentCount")

    .addSelect((qb) => {
      return qb
        .select("COUNT(*)")
        .from(FollowEntity, "follow")
        .where("follow.follower.id = :currentUserId")
        .andWhere("follow.following.id = user.id");
    }, "isFollowing")

    // ⭐ Only this is new
    .where("user.id = :currentUserId")

    .setParameter("currentUserId", currentUserId)

    .orderBy("post.createdAt", "DESC")

    .getRawMany();

  return posts.map((post) => ({
    post_id: post.post_id,
    post_caption: post.post_caption,
    post_images: post.post_images,
    post_createdAt: post.post_createdAt,

    user_id: post.user_id,
    user_name: post.user_name,
    user_username: post.user_username,

    likeCount: Number(post.likeCount),
    commentCount: Number(post.commentCount),

    isFollowing: Number(post.isFollowing) > 0,
    isOwner: true,
  }));
}
  async create(
    createPostDto: CreatePostDto,
    files: Express.Multer.File[],
    userId: string,
  ) { 
    // 1. Check user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
       });
      
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
   
    // 2. Upload all images to Cloudinary
const images: { url: string; publicId: string }[] = [];



for (const file of files) {
  const uploadedImage =
    await this.cloudinaryService.uploadImage(file);
 

  images.push({
    url: uploadedImage.secure_url,
    publicId: uploadedImage.public_id,
  });

  
}

    // 3. Create post
    const post = this.postRepository.create({
      caption: createPostDto.caption,
      images,
      user,
    });
    

    // 4. Save post
    return await this.postRepository.save(post);
}

  async delete(postId: string, userId: string) {

  // Find Post
  const post = await this.postRepository.findOne({
    where: { id: postId },
    relations: {user:true},
  });

  if (!post) {
    throw new NotFoundException('Post not found');
  }

  // Check Ownership
  if (post.user.id !== userId) {
    throw new ForbiddenException(
      'You can delete only your own posts',
    );
  }

  // Delete Images from Cloudinary
  for (const image of post.images) {
    await this.cloudinaryService.deleteImage(image.publicId);
  }

  // Delete Post from Database
  await this.postRepository.remove(post);

  return {
    message: 'Post deleted successfully',
  };
}


}