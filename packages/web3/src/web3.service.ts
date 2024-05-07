import { Injectable } from '@nestjs/common';
import {
  Abi,
  Provider,
  GetTransactionReceiptResponse,
  Contract,
  num,
  BigNumberish,
} from 'starknet';
import config from '@app/shared/configuration';
import { execSync } from 'child_process';
import { ChainDocument, Lotteries } from '@app/shared/models/schemas';
import {
  ABIS,
  EventTopic,
  EventType,
  LogsReturnValues,
  LotteryOnchainDetail,
  TicketOnchainDetail,
} from './types';
import {
  decodeDrawnNumbersReturnValue,
  decodeNewLotteryStarted,
  decodeTicketCreated,
  decodeWithdrawWinningReturnValue,
} from './decode';
import governanceAbi from './abi/governance.json';
import { initPricerMultiplier } from './constant';
import { formattedContractAddress } from '@app/shared/utils';

@Injectable()
export class Web3Service {
  getProvider(rpc: string) {
    const provider = new Provider({ nodeUrl: rpc });
    return provider;
  }

  async getBlockTime(rpc: string) {
    const provider = this.getProvider(rpc);
    const block = await provider.getBlock('latest');
    return block.timestamp;
  }

  async getContractInstance(
    abi: any,
    contractAddress: string,
    rpc: string,
  ): Promise<Contract> {
    const provider = this.getProvider(rpc);
    const contractInstance = new Contract(abi, contractAddress, provider);
    return contractInstance;
  }

  async getLotteryDuration(
    rpc: string,
    lotteryAddress: string,
    chain: ChainDocument,
  ): Promise<number> {
    const provider = this.getProvider(rpc);
    const governanceContract = new Contract(
      governanceAbi,
      chain.governanceContract,
      provider,
    );

    const duration = await governanceContract.getDuration(lotteryAddress);
    return Number(duration.toString());
  }

  async getLotteryDetail(
    lotteryAddress: string,
    lotteryId: number,
    chain: ChainDocument,
  ): Promise<Lotteries> {
    const provider = this.getProvider(chain.rpc);
    const lotteryContract = new Contract(
      ABIS.LotteryABI,
      lotteryAddress,
      provider,
    );

    const lotteryDetail: LotteryOnchainDetail =
      await lotteryContract.getLotteryById(lotteryId);

    const lotteryEntity: Lotteries = {
      chain,
      address: lotteryAddress,
      status: Number(lotteryDetail.state.toString()),
      lotteryId,
      ticketPrice: Number(lotteryDetail.minimumPrice.toString()) / 1e18,
      startTime: Number(lotteryDetail.startTime.toString()) * 1e3,
      drawTime: Number(lotteryDetail.drawTime.toString()) * 1e3,
      jackpot: Number(lotteryDetail.jackpot.toString()) / 1e18,
      prizeMultipliers: initPricerMultiplier,
      drawnNumber: lotteryDetail.drawnNumbers.map((item) =>
        Number(item.toString()),
      ),
    };

    return lotteryEntity;
  }

  async getTicketOnchainDetail(
    ticketId: number,
    chain: ChainDocument,
  ): Promise<TicketOnchainDetail> {
    const provider = this.getProvider(chain.rpc);
    const ticketContract = new Contract(
      ABIS.TicketABI,
      chain.ticketContract,
      provider,
    );

    const ticketDetail = await ticketContract.getTicketById(ticketId);
    const ticketEntity: TicketOnchainDetail = {
      ticketId: Number((ticketDetail.ticketId as bigint).toString()),
      lotteryAddress: formattedContractAddress(
        num.toHex(ticketDetail.lotteryAddress as BigNumberish),
      ),
      pickedNumbers: (ticketDetail.pickedNumbers as bigint[]).map((value) =>
        Number(value.toString()),
      ),
      user: formattedContractAddress(
        num.toHex(ticketDetail.user as BigNumberish),
      ),
      sameCombinationCounter: Number(
        (ticketDetail.sameCombinationCounter as bigint).toString(),
      ),
      lotteryId: Number((ticketDetail.lotteryId as bigint).toString()),
      payOut: Number((ticketDetail.payOut as bigint).toString()),
    };

    return ticketEntity;
  }

  getReturnValuesEvent(
    txReceipt: GetTransactionReceiptResponse,
    chain: ChainDocument,
    timestamp: number,
  ): LogsReturnValues[] {
    const eventWithTypes: LogsReturnValues[] = [];
    const provider = this.getProvider(chain.rpc);

    if (txReceipt.isSuccess()) {
      for (const event of txReceipt.events) {
        const txReceiptFilter = {
          ...txReceipt,
          events: txReceipt.events.filter((ev) => ev == event),
        };

        if (
          event.keys.includes(EventTopic.TICKET_CREATED) &&
          formattedContractAddress(event.from_address) === chain.ticketContract
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.TicketCreated,
            returnValues: decodeTicketCreated(
              txReceiptFilter,
              provider,
              timestamp,
            ),
          });
        } else if (
          event.keys.includes(EventTopic.LOTTERY_STARTED) &&
          formattedContractAddress(event.from_address) === chain.lotteryContract
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.StartNewLottery,
            returnValues: decodeNewLotteryStarted(txReceiptFilter, provider),
          });
        } else if (
          event.keys.includes(EventTopic.DRAWN_NUMBERS) &&
          formattedContractAddress(event.from_address) === chain.lotteryContract
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.DrawnNumbers,
            returnValues: decodeDrawnNumbersReturnValue(
              txReceiptFilter,
              provider,
            ),
          });
        } else if (
          event.keys.includes(EventTopic.WITHDRAW_WINNING) &&
          formattedContractAddress(event.from_address) === chain.lotteryContract
        ) {
          eventWithTypes.push({
            ...txReceiptFilter,
            eventType: EventType.WithdrawWinning,
            returnValues: decodeWithdrawWinningReturnValue(
              txReceiptFilter,
              provider,
            ),
          });
        }
      }
    }
    return eventWithTypes;
  }

  async invokeContractAsAdmin(
    rpc: string,
    contractAddress: string,
    abi: Abi,
    entrypoint: any,
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
    const res = execSync(cml);
    console.log(res);
  }
}
