import { UserDocument, Users } from '@app/shared/models/schemas';
import { formattedContractAddress } from '@app/shared/utils';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v1 as uuidv1 } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(Users.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getOrCreateUser(userAddress: string): Promise<UserDocument> {
    const formatAddress = formattedContractAddress(userAddress);

    let user = await this.userModel.findOne({
      address: formatAddress,
    });
    if (!user) {
      const newUser: Users = {
        address: formatAddress,
        username: formatAddress,
        nonce: uuidv1(),
        isVerified: false,
        roles: [],
      };

      user = await this.userModel.create(newUser);
    }
    return user;
  }

  async updateRandomNonce(address: string): Promise<UserDocument> {
    const formatAddress = formattedContractAddress(address);

    const user = await this.userModel
      .findOneAndUpdate(
        { address: formatAddress },
        { $set: { nonce: uuidv1() } },
        { new: true },
      )
      .exec();

    return user;
  }

  async getUser(userAddress: string): Promise<UserDocument> {
    const formatAddress = formattedContractAddress(userAddress);

    return await this.userModel.findOne({ address: formatAddress });
  }
}
