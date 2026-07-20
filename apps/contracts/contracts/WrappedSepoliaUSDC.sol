// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ERC20ToERC7984Wrapper} from "@iexec-nox/nox-confidential-contracts/contracts/token/extensions/ERC20ToERC7984Wrapper.sol";

/**
 * ERC-20 → ERC-7984 wrapper for Circle Sepolia USDC.
 * Amounts/balances are confidential handles via Nox; addresses stay public.
 *
 * Sepolia USDC: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
 * NoxCompute:   0x24ef36ec5b626d7dcd09a98f3083c2758f0f77bf
 */
contract WrappedSepoliaUSDC is ERC20ToERC7984Wrapper {
    constructor(
        IERC20 underlyingUsdc
    )
        ERC20ToERC7984Wrapper(
            "Wrapped Confidential USDC",
            "wcUSDC",
            "https://veilpay.app/tokens/wcusdc",
            underlyingUsdc
        )
    {}
}
