

   
  pragma solidity^0.7.6;

  import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

  contract THIRDTOKEN is ERC20{

      constructor()ERC20("THIRD","TOKEN"){
        _mint(msg.sender,100e18);
          
      }

    function mint(address to, uint amount) public {
        _mint(to,amount);
    }

      function burn(address to, uint amount) public {
        _burn(to,amount);
    }
}