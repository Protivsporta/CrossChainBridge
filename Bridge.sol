//SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.13;

import "./TokenERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract BridgeETH {
 
    TokenERC20 public token;
    address backendSigner;
    uint256 nonce;

    mapping(uint256 => bool) private _nonces;

    constructor(address _token, address _backendSigner) {
        token = TokenERC20(_token);
        backendSigner = _backendSigner;
    }

    // Functions

    function swap(address _to, uint256 _amount, bytes calldata _signature) external {
        require(_amount > 0, "Amount must be greater than 0");
        bytes32 message = prefixed(keccak256(abi.encodePacked(_to, _amount)));
        require(ecrecoverWrapper(message, _signature) == msg.sender, "Sender must sign message with private key");

        token.burn(msg.sender, _amount);
        emit SwapInitialized(msg.sender, _to, _amount, nonce, _signature);
        nonce ++;

    }

    function redeem(address _from, address _to, uint256 _amount, uint256 _nonce, bytes calldata _senderSignature, bytes calldata _backendSignature) external {
        require(_nonces[_nonce] == false, "Transfer already processed");
        bytes32 message = prefixed(
            keccak256(abi.encodePacked(_from, _to, _amount, _nonce, _senderSignature))
        );
        require(ecrecoverWrapper(message, _backendSignature) == backendSigner, "Wrong signature from backend");
        _nonces[_nonce] = true;
        token.mint(_to, _amount);

        emit Redeemed(_from, _to, _amount);
    }

    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return
            keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function ecrecoverWrapper(bytes32 _message, bytes memory _signature) internal pure returns (address) {
        uint8 v;
        bytes32 r;
        bytes32 s;

        (v, r, s) = splitSignature(_signature);

        return ecrecover(_message, v, r, s);
    }

    function splitSignature(bytes memory _signature) internal pure returns (uint8, bytes32, bytes32) {
        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(_signature, 32))
            // second 32 bytes
            s := mload(add(_signature, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(_signature, 96)))
        }

        return (v, r, s);
    }

    // Events

    event SwapInitialized(
        address _from,
        address _to,
        uint256 amount,
        uint256 _nonce,
        bytes _signature
    );

    event Redeemed(address _from, address _to, uint256 amount);
}
