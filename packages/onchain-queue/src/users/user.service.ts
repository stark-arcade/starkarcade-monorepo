import { UserDTO } from '@app/shared/models/dtos';
import { UserDocument, Users } from '@app/shared/models/schemas';
import { formattedContractAddress } from '@app/shared/utils';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';
import { v1 as uuidv1 } from 'uuid';

@Injectable()
export class UserService {
  constructor(@InjectModel(Users.name) public userModel: Model<UserDocument>) {}

  async getOrCreateUser(address: string): Promise<UserDocument> {
    const userAddress = formattedContractAddress(address);
    let user = await this.userModel.findOne({
      address: userAddress,
    });

    if (!user) {
      const newUser: Users = {
        address: userAddress,
        username: userAddress,
        nonce: uuidv1(),
        isVerified: false,
        roles: [],
      };

      user = await this.userModel.create(plainToInstance(UserDTO, newUser));
    }
    return user;
  }
}
