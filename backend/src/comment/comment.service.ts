import { ForbiddenException, Injectable, NotFoundException, Post } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CommentEntity } from './entity/comment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from 'src/post/entities/post.entity';
import { CreateCommentDto } from './dto/comment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { IsNull } from "typeorm";

@Injectable()
export class CommentService {
    constructor(
        @InjectRepository(CommentEntity)
        private readonly commentRepository: Repository<CommentEntity>,
        @InjectRepository(PostEntity)
        private readonly postRepository: Repository<PostEntity>

    ) { }

    async getAllComment(postId: string, userId: string) {
  const post = await this.postRepository.findOne({
    where: {
      id: postId,
    },
  });

  if (!post) {
    throw new NotFoundException("Post not found");
  }

  const comments = await this.commentRepository.find({
     where: {
    post: {
      id: postId,
    },
    parentComment: IsNull(),
  },

    relations: {
    user: true,
    replies: {
      user: true,
    },
  },

    order: {
      createdAt: "DESC",

      replies: {
        createdAt: "ASC",
      },
    },
  });

  return comments.map((comment) => ({
    id: comment.id,

    text: comment.text,

    createdAt: comment.createdAt,

    user_name: comment.user.name,

    user_username: comment.user.username,

    isOwner: comment.user.id === userId,

   replies: comment.replies.map((reply) => ({
  id: reply.id,
  text: reply.text,
  createdAt: reply.createdAt,
  user_name: reply.user.name,
  user_username: reply.user.username,
  isOwner: reply.user.id === userId,

  replies: [], 
})),
  }));
}

    async createComment(postId: string, userId: string, createcommentdto: CreateCommentDto) {

        const post = await this.postRepository.findOne({ where: { id: postId } })

        if (!post) {
            throw new NotFoundException('Post not found');
        }
        let parentComment: CommentEntity | null = null;

        if (createcommentdto.parentCommentId) {
            parentComment = await this.commentRepository.findOne({
                where: {
                    id: createcommentdto.parentCommentId,
                },
            });

            if (!parentComment) {
                throw new NotFoundException('Parent comment not found');
            }
        }

        const comment = this.commentRepository.create({
            text: createcommentdto.text,

            post: {
                id: postId,
            },

            user: {
                id: userId,
            },
        });

        if (createcommentdto.parentCommentId) {
            comment.parentComment = { id: createcommentdto.parentCommentId } as CommentEntity
        }

        await this.commentRepository.save(comment)
        return comment;


    }   

    async editComment(
        commentId: string,
        userId: string,
        updateCommentDto: UpdateCommentDto,
    ) {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
            relations: {
                user: true,
            },
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        if (comment.user.id !== userId) {
            throw new ForbiddenException('Forbidden');
        }

        comment.text = updateCommentDto.text;

        await this.commentRepository.save(comment);

        return {
            message: 'Comment updated successfully',
            comment,
        };
    }
    async deleteComment(commentId: string, userId: string) {
        const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: { user: true } })

        if (!comment) {
            throw new NotFoundException('comment not found ')
        }
        if (comment.user.id !== userId) {
            throw new ForbiddenException('forbidden')
        }

        
        await this.commentRepository.delete(comment.id)
        return { message: "comment deleted successfully" }


    }



}
