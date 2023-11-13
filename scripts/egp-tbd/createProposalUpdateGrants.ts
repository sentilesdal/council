import { Provider } from "@ethersproject/providers";
import timelockInterface from "artifacts/contracts/features/Timelock.sol/Timelock.json";
import { ethers, Signer } from "ethers";
import hre from "hardhat";
import { CoreVoting__factory, SimpleProxy__factory } from "typechain";

import addressesJson from "src/addresses";
import { DAY_IN_BLOCKS } from "src/constants";
import { createCallHash } from "src/helpers/createCallHash";
import { ProposalArgs, ProposalInfo } from "src/types";

const { coreVoting, timeLock, lockingVault } = addressesJson.addresses;
const NEW_LOCKING_VAULT_IMPLEMENTATION =
  "0x7a58784063D41cb78FBd30d271F047F0b9156d6e";

export async function createProposal(
  signer: Signer,
  votingVaultAddresses: string[],
  extraVaultDatas: string[]
): Promise<ProposalInfo> {
  const provider = hre.ethers.getDefaultProvider();

  const proposalInfo = await createUpgradeProposal(
    signer,
    provider,
    votingVaultAddresses,
    extraVaultDatas
  );

  return proposalInfo;
}

export async function createUpgradeProposal(
  signer: Signer,
  provider: Provider,
  // voting vaults to query vote power from to submit proposal
  votingVaultAddresses: string[],
  // extra data for voting vaults if necessary
  extraVaultData: string[]
): Promise<ProposalInfo> {
  /********************************************************************************
   * Set up a new proposal.  This proposal will perform 1 action:
   *   1. upgrade the LockingVault implementation.
   ********************************************************************************/

  // step 1 is to update the locking vault implementation address
  const {
    targets,
    callDatas,
    proposalHash,
    targetsTimeLock,
    calldatasTimeLock,
    callHashTimelock,
  } = await getProposalArgs();

  const ballot = 0; // 0 - YES, 1 - NO, 2 - ABSTAIN

  const coreVotingContract = CoreVoting__factory.connect(coreVoting, signer);

  // last chance to execute to vote is ~14 days from current block
  const currentBlock = await provider.getBlockNumber();
  const lastCall = Math.round(DAY_IN_BLOCKS * 14 + currentBlock);

  const tx = await coreVotingContract.proposal(
    votingVaultAddresses,
    extraVaultData,
    targets,
    callDatas,
    lastCall,
    ballot
  );
  await tx.wait(1);

  // just getting the proposalId
  const proposalCreatedEvents = await coreVotingContract.queryFilter(
    coreVotingContract.filters.ProposalCreated(),
    currentBlock
  );
  const proposalId = proposalCreatedEvents[0].args[0].toNumber();

  const proposalArgs = [
    ["proposalId", proposalId],
    ["votingVaults", votingVaultAddresses],
    ["extraVaultData", extraVaultData],
    ["targets", targets],
    ["callDatas", callDatas],
    ["proposalHash", proposalHash],
    ["targetsTimeLock", targetsTimeLock],
    ["calldatasTimeLock", calldatasTimeLock],
    ["callHashTimelock", callHashTimelock],
    ["lastCall", lastCall],
    ["ballot", ballot],
  ];

  console.log("Proposal created with:");
  proposalArgs.forEach(([name, value]) => console.log(name, value));

  const proposalInfo: ProposalInfo = Object.fromEntries(proposalArgs);
  return proposalInfo;
}

export async function getProposalArgs(): Promise<ProposalArgs> {
  const proxyInterface = new ethers.utils.Interface(SimpleProxy__factory.abi);
  // upgrade the locking vault's implementation contract
  const callDataProxyUpgrade = proxyInterface.encodeFunctionData(
    "upgradeProxy",
    [NEW_LOCKING_VAULT_IMPLEMENTATION]
  );

  const calldatasTimeLock = [callDataProxyUpgrade];

  const targetsTimeLock = calldatasTimeLock.map(() => lockingVault);
  const callHashTimelock = await createCallHash(
    calldatasTimeLock,
    targetsTimeLock
  );

  const timeLockInterface = new ethers.utils.Interface(timelockInterface.abi);
  const calldataCoreVoting = timeLockInterface.encodeFunctionData(
    "registerCall",
    [callHashTimelock]
  );

  const targets = [timeLock];
  const callDatas = [calldataCoreVoting];
  const proposalHash = await createCallHash(callDatas, targets);

  return {
    targets,
    callDatas,
    proposalHash,
    targetsTimeLock,
    calldatasTimeLock,
    callHashTimelock,
  };
}
