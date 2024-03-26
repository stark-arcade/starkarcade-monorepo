import { Provider } from 'starknet';
import { Web3Service } from '../web3.service';
import chain from './mocks/chain.json';
import { ChainDocument } from '@app/shared/models/schemas';

describe('Web3Service', () => {
  let web3Service: Web3Service;
  let provider: Provider;

  beforeEach(() => {
    web3Service = new Web3Service();
    provider = web3Service.getProvider(chain.rpc);
  });

  it('getReturnValuesEvent', async () => {
    const txReceipt = await provider.getTransactionReceipt(
      '0x030d41a499066a1463029275d114410de8a79a76dcdca4481ecb33c1aad787c9',
    );

    const block = await provider.getBlock(52111);
    const returnValues = web3Service.getReturnValuesEvent(
      txReceipt,
      chain as ChainDocument,
      block.timestamp,
    );

    console.log(
      returnValues[0].returnValues.pickedNumbers.map((value: bigint) =>
        Number(value.toString()),
      ),
    );
  });

  it('getLotteryDetail', async () => {
    const lotteryDetail = await web3Service.getLotteryDetail(
      chain.lotteryContract,
      4,
      chain as ChainDocument,
    );

    console.log(lotteryDetail);
  });
});
