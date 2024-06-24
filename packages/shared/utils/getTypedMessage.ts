import { shortString } from 'starknet';

export const getClaimPointMessage = (
  userAddress: string,
  point: number,
  timestamp: number,
  chainName: string,
) => {
  const typedMessage = {
    types: {
      StarkNetDomain: [
        {
          name: 'name',
          type: 'felt',
        },
        {
          name: 'version',
          type: 'felt',
        },
        {
          name: 'chainId',
          type: 'felt',
        },
      ],
      SetterPoint: [
        {
          name: 'address',
          type: 'ContractAddress',
        },
        {
          name: 'point',
          type: 'u128',
        },
        {
          name: 'timestamp',
          type: 'u128',
        },
      ],
    },
    primaryType: 'SetterPoint',
    domain: {
      name: 'poolpoint',
      version: '1',
      chainId: shortString.encodeShortString(chainName),
    },
    message: {
      address: userAddress,
      point,
      timestamp,
    },
  };

  return typedMessage;
};

export const getSettleMessage = (
  gameId: string,
  guess: number,
  seed: string,
) => {
  return {
    types: {
      StarkNetDomain: [
        {
          name: 'name',
          type: 'felt',
        },
        {
          name: 'version',
          type: 'felt',
        },
        {
          name: 'chainId',
          type: 'felt',
        },
      ],
      Settle: [
        {
          name: 'game_id',
          type: 'felt',
        },
        {
          name: 'guess',
          type: 'u8',
        },
        {
          name: 'seed',
          type: 'u128',
        },
      ],
    },
    primaryType: 'Settle',
    domain: {
      name: 'StarkFlip',
      version: '1',
      chainId: shortString.encodeShortString('SN_MAIN'),
    },
    message: {
      game_id: gameId,
      guess,
      seed,
    },
  };
};
