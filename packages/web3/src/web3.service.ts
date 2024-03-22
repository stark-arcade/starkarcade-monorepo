import { Injectable } from '@nestjs/common';
import { RawArgs, Contract, Abi, Provider, Account, CallData } from 'starknet';
import config from '@app/shared/configuration';
import { execSync, exec, spawn } from 'child_process';

@Injectable()
export class Web3Service {
  getProvider(rpc: string) {
    const provider = new Provider({ nodeUrl: rpc });
    return provider;
  }

  async getBlockTime(rpc: string) {
    const provider = this.getProvider(rpc);
    const block = await provider.getBlock('latest');
    console.log(block);
    return block.timestamp;
  }

  async invokeContractAsAdmin(
    rpc: string,
    contractAddress: string,
    abi: Abi,
    entrypoint: any,
    rawArgs?: RawArgs,
  ) {
    // const provider = this.getProvider(rpc);
    // const contract = new Contract(abi, contractAddress, provider);

    // const adminAccount = new Account(
    //   provider,
    //   config().admin_wallet.account_address,
    //   config().admin_wallet.private_key,
    // );

    // contract.connect(adminAccount);

    // const rollCall = contract.populate(entrypoint, rawArgs);
    // console.log(rollCall);
    // const response = await contract[entrypoint](rollCall.calldata);
    // console.log(response);

    const cml = `starkli invoke ${contractAddress} ${entrypoint} --rpc ${rpc} --account ${config().admin_wallet.account_path} --keystore ${config().admin_wallet.keystore_path}`;
    const res = spawn(cml);
    console.log(
      res.on('message', (code, signal) => {
        console.log({ code, signal });
      }),
    );
  }
}
