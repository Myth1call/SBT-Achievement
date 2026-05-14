// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// ----- LAYER: imports -----
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721Pausable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract AchievementNFT is ERC721Pausable, ERC721URIStorage, AccessControl {
  // ----- LAYER: constants -----
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

  mapping(address => mapping(bytes32 =>bool)) private s_earnedAchievements;
  mapping(uint256=>bytes32) private s_tokenIdToAchievementKey;

  // ----- LAYER: state variables -----
  uint256 private s_nextTokenId;

  // ----- LAYER: events -----
  event AchievementMinted(
    address indexed to, 
    uint256 indexed tokenId, 
    bytes32 indexed achievementKey,
    string metadataURI
    );

  // ----- LAYER: errors -----
  error AchievementNFT__AchievementAlreadyMinted(
    address owner,
    bytes32 achievementKey
  );
  error AchievementNFT__SoulboundTokenCannotBeTransferedOrBurned(
    uint256 tokenId
  );

  // ----- LAYER: modifiers -----
  // (none; OZ: onlyRole, onlyOwner)

  // ----- LAYER: constructor -----
  constructor() ERC721("AchievementNFT", "ACH") {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MINTER_ROLE, msg.sender);
  }

  // ----- LAYER: internal -----
  function _update(
    address to,
    uint256 tokenId,
    address auth
  ) 
  internal 
  override(ERC721Pausable, ERC721) 
  returns (address) {
    address from = _ownerOf(tokenId);
    if(from != address(0) ){
      revert AchievementNFT__SoulboundTokenCannotBeTransferedOrBurned(tokenId);
    }
    return super._update(to, tokenId, auth);
  }

  // ----- LAYER: private -----
  // (none)

  // ----- LAYER: external -----

  function mintAchievement(
    address to, 
    bytes32 achievementKey,
    string calldata metadataURI
    ) 
    external 
    onlyRole(MINTER_ROLE)
    whenNotPaused
    returns (uint256)
    {
      if(s_earnedAchievements[to][achievementKey]){
         revert AchievementNFT__AchievementAlreadyMinted(to, achievementKey);
      }
    s_tokenIdToAchievementKey[s_nextTokenId]=achievementKey;
    s_earnedAchievements[to][achievementKey] = true;
    uint256 tokenId=s_nextTokenId++;
    _safeMint(to, tokenId, "");
    _setTokenURI(tokenId, metadataURI);
    emit AchievementMinted(
      to, 
      tokenId,
      achievementKey,
      metadataURI
      );
    return tokenId;
  }

  
  function pause() external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused {
    _pause();
  }

  function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) whenPaused {
    _unpause();
  }

  function hasAchievement(
    address owner,
    bytes32 achievementKey
  ) 
  external 
  view 
  returns (bool) {
    return s_earnedAchievements[owner][achievementKey];
  }

  function getAchievementKey(
    uint256 tokenId
  )
  external 
  view 
  returns (bytes32) {
    return s_tokenIdToAchievementKey[tokenId];
  }

// ----- LAYER:  public  -----
  function tokenURI(
    uint256 tokenId
  ) public view override(ERC721URIStorage, ERC721) returns (string memory) {
    return super.tokenURI(tokenId);
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(ERC721URIStorage, ERC721, AccessControl) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
  function grantRole(
    bytes32 role,
    address account
  ) 
  public
  override
  onlyRole(DEFAULT_ADMIN_ROLE) {
    _grantRole(role, account);
  }

  function revokeRole(
    bytes32 role,
    address account
  ) 
  public
  override
  onlyRole(DEFAULT_ADMIN_ROLE) {
    _revokeRole(role, account);
  } 

}
