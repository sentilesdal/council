import { formatEther } from "ethers/lib/utils";
// # Script to update grants with new values
import hre from "hardhat";
import { main as setQuorum } from "scripts/helpers/setQuorum";
import { main as jumpForward } from "scripts/helpers/jumpForward";
import { previewProposal } from "./previewProposal";
import { executeProposal } from "./executeProposal";
import { executeTimelock } from "./executeTimelock";
import { createProposal } from "./createProposal";
import { getSigner } from "scripts/helpers/getSigner";
import {
  CoreVoting__factory,
  ERC20Permit__factory,
  MockERC20__factory,
  Treasury__factory,
} from "typechain";
import addressesJson from "src/addresses";
import { BigNumber, Wallet } from "ethers";

const delvWalletAddress = "0xF6094C3A380AD6161Fb8240F3043392A0E427CAC";
const foundationWalletAddress = "0x0000000000000000000000000000000000000001";
const erc20DeployedBytecode =
  "0x608060405234801561001057600080fd5b506004361061018d5760003560e01c80637ecebe00116100e3578063b91816111161008c578063dd62ed3e11610066578063dd62ed3e146103ca578063e30443bc146103f5578063fe9fbb801461042c5761018d565b8063b91816111461034d578063d505accf14610370578063da46098c146103835761018d565b80639dc29fac116100bd5780639dc29fac14610314578063a9059cbb14610327578063b6a5d7de1461033a5761018d565b80637ecebe00146102a75780638da5cb5b146102c757806395d89b411461030c5761018d565b806327c97fa5116101455780633644e5151161011f5780633644e5151461026b57806340c10f191461027457806370a08231146102875761018d565b806327c97fa51461021257806330adf81f14610225578063313ce5671461024c5761018d565b806313af40351161017657806313af4035146101d357806318160ddd146101e857806323b872dd146101ff5761018d565b806306fdde0314610192578063095ea7b3146101b0575b600080fd5b61019a61043f565b6040516101a7919061116e565b60405180910390f35b6101c36101be366004611145565b6104cd565b60405190151581526020016101a7565b6101e66101e136600461104d565b610546565b005b6101f160095481565b6040519081526020016101a7565b6101c361020d366004611099565b6105f9565b6101e661022036600461104d565b61082d565b6101f17f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c981565b6002546102599060ff1681565b60405160ff90911681526020016101a7565b6101f160065481565b6101e6610282366004611145565b6108e0565b6101f161029536600461104d565b60036020526000908152604090205481565b6101f16102b536600461104d565b60056020526000908152604090205481565b6007546102e79073ffffffffffffffffffffffffffffffffffffffff1681565b60405173ffffffffffffffffffffffffffffffffffffffff90911681526020016101a7565b61019a610955565b6101e6610322366004611145565b610962565b6101c3610335366004611145565b6109d3565b6101e661034836600461104d565b6109e7565b6101c361035b36600461104d565b60086020526000908152604090205460ff1681565b6101e661037e3660046110d4565b610aa4565b6101e6610391366004611099565b73ffffffffffffffffffffffffffffffffffffffff92831660009081526004602090815260408083209490951682529290925291902055565b6101f16103d8366004611067565b600460209081526000928352604080842090915290825290205481565b6101e6610403366004611145565b73ffffffffffffffffffffffffffffffffffffffff909116600090815260036020526040902055565b6101c361043a36600461104d565b610e43565b6000805461044c9061120e565b80601f01602080910402602001604051908101604052809291908181526020018280546104789061120e565b80156104c55780601f1061049a576101008083540402835291602001916104c5565b820191906000526020600020905b8154815290600101906020018083116104a857829003601f168201915b505050505081565b33600081815260046020908152604080832073ffffffffffffffffffffffffffffffffffffffff8716808552925280832085905551919290917f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925906105359086815260200190565b60405180910390a350600192915050565b60075473ffffffffffffffffffffffffffffffffffffffff1633146105b25760405162461bcd60e51b815260206004820152601060248201527f53656e646572206e6f74206f776e65720000000000000000000000000000000060448201526064015b60405180910390fd5b600780547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff92909216919091179055565b73ffffffffffffffffffffffffffffffffffffffff83166000908152600360205260408120548281101561066f5760405162461bcd60e51b815260206004820152601b60248201527f45524332303a20696e73756666696369656e742d62616c616e6365000000000060448201526064016105a9565b73ffffffffffffffffffffffffffffffffffffffff851633146107725773ffffffffffffffffffffffffffffffffffffffff851660009081526004602090815260408083203384529091529020547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff811461077057838110156107345760405162461bcd60e51b815260206004820152601d60248201527f45524332303a20696e73756666696369656e742d616c6c6f77616e636500000060448201526064016105a9565b61073e84826111f7565b73ffffffffffffffffffffffffffffffffffffffff871660009081526004602090815260408083203384529091529020555b505b61077c83826111f7565b73ffffffffffffffffffffffffffffffffffffffff80871660009081526003602052604080822093909355908616815220546107b99084906111df565b73ffffffffffffffffffffffffffffffffffffffff80861660008181526003602052604090819020939093559151908716907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9061081a9087815260200190565b60405180910390a3506001949350505050565b60075473ffffffffffffffffffffffffffffffffffffffff1633146108945760405162461bcd60e51b815260206004820152601060248201527f53656e646572206e6f74206f776e65720000000000000000000000000000000060448201526064016105a9565b73ffffffffffffffffffffffffffffffffffffffff16600090815260086020526040902080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00169055565b60075473ffffffffffffffffffffffffffffffffffffffff1633146109475760405162461bcd60e51b815260206004820152601060248201527f53656e646572206e6f74206f776e65720000000000000000000000000000000060448201526064016105a9565b6109518282610e72565b5050565b6001805461044c9061120e565b60075473ffffffffffffffffffffffffffffffffffffffff1633146109c95760405162461bcd60e51b815260206004820152601060248201527f53656e646572206e6f74206f776e65720000000000000000000000000000000060448201526064016105a9565b6109518282610f35565b60006109e03384846105f9565b9392505050565b60075473ffffffffffffffffffffffffffffffffffffffff163314610a4e5760405162461bcd60e51b815260206004820152601060248201527f53656e646572206e6f74206f776e65720000000000000000000000000000000060448201526064016105a9565b610aa18173ffffffffffffffffffffffffffffffffffffffff16600090815260086020526040902080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00166001179055565b50565b60065473ffffffffffffffffffffffffffffffffffffffff8881166000818152600560209081526040918290205482517f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c981840152808401859052948c166060860152608085018b905260a085015260c08085018a90528251808603909101815260e0850183528051908201207f1901000000000000000000000000000000000000000000000000000000000000610100860152610102850195909552610122808501959095528151808503909501855261014290930190528251929091019190912090610bd45760405162461bcd60e51b815260206004820152601860248201527f45524332303a20696e76616c69642d616464726573732d30000000000000000060448201526064016105a9565b60408051600081526020810180835283905260ff861691810191909152606081018490526080810183905260019060a0016020604051602081039080840390855afa158015610c27573d6000803e3d6000fd5b5050506020604051035173ffffffffffffffffffffffffffffffffffffffff168873ffffffffffffffffffffffffffffffffffffffff1614610cab5760405162461bcd60e51b815260206004820152601560248201527f45524332303a20696e76616c69642d7065726d6974000000000000000000000060448201526064016105a9565b841580610cb85750844211155b610d045760405162461bcd60e51b815260206004820152601560248201527f45524332303a207065726d69742d65787069726564000000000000000000000060448201526064016105a9565b7f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0821115610d9a5760405162461bcd60e51b815260206004820152602260248201527f45524332303a20696e76616c6964207369676e6174757265202773272076616c60448201527f756500000000000000000000000000000000000000000000000000000000000060648201526084016105a9565b73ffffffffffffffffffffffffffffffffffffffff88166000908152600560205260408120805491610dcb83611262565b909155505073ffffffffffffffffffffffffffffffffffffffff8881166000818152600460209081526040808320948c16808452948252918290208a905590518981527f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925910160405180910390a35050505050505050565b73ffffffffffffffffffffffffffffffffffffffff811660009081526008602052604090205460ff165b919050565b73ffffffffffffffffffffffffffffffffffffffff8216600090815260036020526040902054610ea39082906111df565b73ffffffffffffffffffffffffffffffffffffffff831660009081526003602052604081209190915560098054839290610ede9084906111df565b909155505060405181815273ffffffffffffffffffffffffffffffffffffffff8316906000907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a35050565b73ffffffffffffffffffffffffffffffffffffffff821660009081526003602052604090205481811015610f8e5773ffffffffffffffffffffffffffffffffffffffff8316600090815260036020526040812055610fbf565b610f9882826111f7565b73ffffffffffffffffffffffffffffffffffffffff84166000908152600360205260409020555b8160096000828254610fd191906111f7565b909155505060405182815260009073ffffffffffffffffffffffffffffffffffffffff8516907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a3505050565b803573ffffffffffffffffffffffffffffffffffffffff81168114610e6d57600080fd5b60006020828403121561105e578081fd5b6109e082611029565b60008060408385031215611079578081fd5b61108283611029565b915061109060208401611029565b90509250929050565b6000806000606084860312156110ad578081fd5b6110b684611029565b92506110c460208501611029565b9150604084013590509250925092565b600080600080600080600060e0888a0312156110ee578283fd5b6110f788611029565b965061110560208901611029565b95506040880135945060608801359350608088013560ff81168114611128578384fd5b9699959850939692959460a0840135945060c09093013592915050565b60008060408385031215611157578182fd5b61116083611029565b946020939093013593505050565b6000602080835283518082850152825b8181101561119a5785810183015185820160400152820161117e565b818111156111ab5783604083870101525b50601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe016929092016040019392505050565b600082198211156111f2576111f261129b565b500190565b6000828210156112095761120961129b565b500390565b600181811c9082168061122257607f821691505b6020821081141561125c577f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b50919050565b60007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8214156112945761129461129b565b5060010190565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fdfea26469706673582212204f449ec99911975b6933631be7c79637946797f1b703b0a961b1a81e762aa48264736f6c63430008030033";

async function main() {
  const signer = await getSigner();
  if (!signer) {
    return;
  }

  await printFunds(signer);

  await deployMockHdToken();

  await previewProposal();
  await setQuorum();
  await createProposal(signer);
  await jumpForward();
  await executeProposal(signer);
  await increaseTime(8 * 24 * 60 * 60);
  await executeTimelock(signer);

  await printSummary(signer);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log("error");
    console.error(error);
    process.exit(1);
  });

async function deployMockHdToken() {
  const hdTokenAddress = addressesJson.addresses.hdToken;
  const hdTokenByteCode = erc20DeployedBytecode;

  console.log("deploying HD Token at ", hdTokenAddress);
  await hre.ethers.provider.send("hardhat_setCode", [
    hdTokenAddress,
    hdTokenByteCode,
  ]);

  const { timeLock } = addressesJson.addresses;
  const newOwner = timeLock;

  // Convert values to storage format
  const ownerPadded = hre.ethers.utils.hexZeroPad(newOwner, 32);

  // Write to storage
  await hre.ethers.provider.send("hardhat_setStorageAt", [
    hdTokenAddress,
    "0x7", // Slot 0: owner
    ownerPadded,
  ]);
}

async function increaseTime(seconds: number) {
  await hre.network.provider.send("evm_increaseTime", [seconds]);
}

async function printFunds(signer: Wallet) {
  const { elementToken, treasury } = addressesJson.addresses;
  const tokenContract = ERC20Permit__factory.connect(elementToken, signer);
  const delvBalance = await tokenContract.balanceOf(delvWalletAddress);
  const treasuryBalance = await tokenContract.balanceOf(treasury);
  console.log("delv elfi balance", delvWalletAddress, formatEther(delvBalance));
  console.log("treasury elfi balance", treasury, formatEther(treasuryBalance));

  return { delvBalance, treasuryBalance };
}

async function printSummary(signer: Wallet) {
  const {
    elementToken,
    hdToken,
    treasury,
    coreVoting,
    lockingVault,
    vestingVault,
    gscCoreVoting,
    hdLockingVault,
    hdMigrationLinearVestingVault,
    hdMigrationRewardsVault,
    hdGscVault,
    gscVault,
  } = addressesJson.addresses;
  console.log("\n**********************************");
  console.log("****** Summary of proposal *******");
  console.log("**********************************");
  const tokenContract = MockERC20__factory.connect(elementToken, signer);

  console.log("Remove vaults from CoreVoting:");
  const coreVotingContract = await CoreVoting__factory.connect(
    coreVoting,
    signer
  );
  const lockingVaultApproved = await coreVotingContract.approvedVaults(
    lockingVault
  );
  const vestingVaultApproved = await coreVotingContract.approvedVaults(
    vestingVault
  );
  console.log("lockingVaultApproved", lockingVaultApproved);
  console.log("vestingVaultApproved", vestingVaultApproved);
  console.log("");

  console.log("Remove gscVault from gscCoreVoting:");
  const gscCoreVotingContract = await CoreVoting__factory.connect(
    gscCoreVoting,
    signer
  );
  const gscVaultApproved = await gscCoreVotingContract.approvedVaults(gscVault);
  console.log("gscVaultApproved", gscVaultApproved);
  console.log("");

  console.log("Add vaults to CoreVoting:");
  const hdLockingVaultApproved = await coreVotingContract.approvedVaults(
    hdLockingVault
  );
  const hdMigrationLinearVestingVaultApproved =
    await coreVotingContract.approvedVaults(hdMigrationLinearVestingVault);
  const hdMigrationRewardsVaultApproved =
    await coreVotingContract.approvedVaults(hdMigrationRewardsVault);
  console.log("hdLockingVaultApproved               ", hdLockingVaultApproved);
  console.log(
    "hdMigrationLinearVestingVaultApproved",
    hdMigrationLinearVestingVaultApproved
  );
  console.log(
    "hdMigrationRewardsVaultApproved      ",
    hdMigrationRewardsVaultApproved
  );
  console.log("");

  console.log("Add vaults to gscCoreVoting:");
  const hdGscVaultApproved = await gscCoreVotingContract.approvedVaults(
    hdGscVault
  );
  console.log("hdGscVaultApproved", hdGscVaultApproved);
  console.log("");

  console.log("Set allowance for vaults from the treasury for HD tokens:");
  const hdTokenContract = MockERC20__factory.connect(hdToken, signer);
  const hdLockingVaultApprovedForTreasury = await hdTokenContract.allowance(
    treasury,
    hdLockingVault
  );
  const hdMigrationRewardsVaultApprovedForTreasury =
    await hdTokenContract.allowance(treasury, hdMigrationRewardsVault);
  const hdLinearVestingVaultApprovedForTreasury =
    await hdTokenContract.allowance(treasury, hdMigrationLinearVestingVault);
  const hdGscVaultApprovedForTreasury = await hdTokenContract.allowance(
    treasury,
    hdGscVault
  );
  console.log(
    "hdLockingVaultApprovedForTreasury",
    formatEther(hdLockingVaultApprovedForTreasury)
  );
  console.log(
    "hdLinearVestingVaultApprovedForTreasury",
    formatEther(hdLinearVestingVaultApprovedForTreasury)
  );
  console.log(
    "hdMigrationRewardsVaultApprovedForTreasury",
    formatEther(hdMigrationRewardsVaultApprovedForTreasury)
  );
  console.log(
    "hdGscVaultApprovedForTreasury",
    formatEther(hdGscVaultApprovedForTreasury)
  );
  console.log("");

  console.log("Burn ELFI balances for Delv, Foundation, Treasury:");
  const delvElfiBalace = await tokenContract.balanceOf(delvWalletAddress);
  const foundationElfiBalace = await tokenContract.balanceOf(
    foundationWalletAddress
  );
  const treasuryElfiBalance = await tokenContract.balanceOf(treasury);
  console.log("delvElfiBalace", formatEther(delvElfiBalace));
  console.log("foundationElfiBalace", formatEther(foundationElfiBalace));
  console.log("treasuryElfiBalance", formatEther(treasuryElfiBalance));
  console.log("");

  console.log("Mint 10x HD balances for Delv, Foundation, Treasury");
  const delvHdBalace = await hdTokenContract.balanceOf(delvWalletAddress);
  const foundationHdBalace = await hdTokenContract.balanceOf(
    foundationWalletAddress
  );
  const treasuryHdBalance = await hdTokenContract.balanceOf(treasury);
  console.log("delvHdBalace", formatEther(delvHdBalace));
  console.log("foundationHdBalace", formatEther(foundationHdBalace));
  console.log("treasuryHdBalance", formatEther(treasuryHdBalance));
  console.log("");

  console.log("revoke mint privileges for the ELFI token:");
  const owner = await tokenContract.owner();
  console.log("owner", owner);
  console.log("\n**********************************");
  console.log("****** End of Summary ************");
  console.log("**********************************");
}
