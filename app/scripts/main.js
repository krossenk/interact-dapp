/**
 * web3JS DAPP by KRK
 * Interact DAPP
 */


var autoRetrieveFlag = true;

// Holds the accounts
var accounts;

// Holds the filter objects
var filterWatch;
var filterEventCounter;

// Holds the contract event object
var contractEvent;
var contractEventCounter=0;

// Maintains the info on node type
var     nodeType = 'geth';
var compiledBytecode = '0x6060604052341561000f57600080fd5b6101be8061001e6000396000f300606060405263ffffffff7c010000000000000000000000000000000000000000000000000000000060003504166312e92de3811461005d57806362777662146100755780638c659ab71461009a578063bd5b3837146100d657600080fd5b341561006857600080fd5b6100736004356100e9565b005b341561008057600080fd5b610088610162565b60405190815260200160405180910390f35b34156100a557600080fd5b6100ad610168565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b34156100e157600080fd5b610088610184565b60008190556002805473ffffffffffffffffffffffffffffffffffffffff19163373ffffffffffffffffffffffffffffffffffffffff90811691909117918290554260018190559116827f8c3f8124db3586b01b1a3687e65ac69ea4815aa8e9479454b8a8963bf1c6c2a860405160405180910390a450565b60005490565b60025473ffffffffffffffffffffffffffffffffffffffff1690565b600154603c429190910304905600a165627a7a72305820acf3d5ad3cd3cfde8eff165603548ea9543b53ebe423c9a196ab4fb6498679a10029';
var compiledAbiDefinition = '[{"constant":false,"inputs":[{"name":"yourName","type":"bytes32"}],"name":"interact","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"currentName","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"fromAddres","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"lastUpdatedMinutes","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"name","type":"bytes32"},{"indexed":true,"name":"addr","type":"address"},{"indexed":true,"name":"timeUpdated","type":"uint256"}],"name":"Interaction","type":"event"}]';
var contractAddress = '0x9B494F4d4007B4a898ae9b7c4Afb465dE56b920F'


/**
 * This method gets invoked when document is ready
 */
function    startApp(){
// Checking if Web3 has been injected by the browser (Mist/MetaMask)
if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.log('Injected web3 Not Found!!!')
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

    var provider = document.getElementById('provider_url').value;
    window.web3 = new Web3(new Web3.providers.HttpProvider(provider));
  }


    // Set the connect status on the app
    if (web3 && web3.isConnected()) {
        setData('connect_status','Connected', false);
        document.getElementById('contract_address').value=contractAddress;

        if(autoRetrieveFlag) doGetAccounts();

    } else {
        setData('connect_status','Not Connected', true);
    }

    // no action to be taken if this flag is OFF  
    // during development for convinience you may set autoRetrieveFlag=true
    if(!autoRetrieveFlag)  return;
}

/**
 * Gets the accounts under the node
 * 
 */

function    doGetAccounts() {
    // This is the synch call for getting the accounts
    
    // Asynchronous call to get the accounts
    // result = [Array of accounts]
    // MetaMask returns 1 account in the array - that is the currently selected account
    web3.eth.getAccounts(function (error, result) {
        if (error) {
            //setData('accounts_count', error, true);
            console.log("Get Accounts error: " + error);
        } else {
            accounts = result;
            console.log("Get Accounts result: " + accounts)

            //setData('accounts_count', result.length, false);
            // You need to have at least 1 account to proceed
            if(result.length == 0) {
                if(nodeType == 'metamask'){
                    alert('Unlock MetaMask *and* click \'Get Accounts\'');
                }
                return;
            }

            // Remove the list items that may already be there
            //removeAllChildItems('accounts_list');
            // Add the accounts as list items
            for (var i = 0; i < result.length; i++) {
                //addAccountsToList('accounts_list',i,result[i])
            }
            
            var coinbase = web3.eth.coinbase;
            // trim it so as to fit in the window/UI
            if(coinbase) coinbase = coinbase.substring(0,25)+'...'
            //setData('coinbase', coinbase, false);
            // set the default accounts
            var defaultAccount = web3.eth.defaultAccount;
            if(!defaultAccount){
                web3.eth.defaultAccount =  result[0];
                defaultAccount = '[Undef]' + result[0];
            }

            defaultAccount = defaultAccount.substring(0,25)+'...';
        }
    });
}

/**
 * This method is called for connecting to the node
 * The Provider URL is provided in a Document element with the 
 * id = provider_url
 */
function doConnect()    {
    setData('connect_status','Not Connected', true);
    // Get the provider URL
    var provider = document.getElementById('provider_url').value;
    window.web3 = new Web3(new Web3.providers.HttpProvider(provider));
    startApp();
}

/**
 * Starting geth 1.6 - Solidity compilation is not allowed from
 * web3 JSON/RPC
 */

function    doCompileSolidityContract(contractCode)  {
    
    
        var source = contractCode;
      
        console.log(flattenSource(source));
    
        web3.eth.compile.solidity(source, function(error, result){
    
            if(error){
                console.log(error);
                //setData('compilation_result',error,true);
            } else {
                // This is an issue seen only on windows - solc compile binary - ignore
                result = compileResultWindowsHack(result);
                console.log('Compilation Result=',JSON.stringify(result));
                var contract_1 = '';
                var code_1 = '';
                var abi_1 = '';
                for(var prop in result){
                    contract_1 = prop;
                    code_1 = result[prop].code;
                    if(!code_1){
                        // Test RPC returns code in result.code
                        code_1 = result.code;
                    }
                    if(result[prop].info){
                        abi_1 = result[prop].info.abiDefinition;
                    } else {
                        // Test RPC does not have the contracts :) in result
                        abi_1 = result.info.abiDefinition;
                    }
                    break;
                }
                // Populate the UI elements
                compiledBytecode=code_1;
                compiledAbiDefinition=JSON.stringify(abi_1);
                
            }
        });
    }

/**
 * Deploys the contract - ASYNCH
 */

function    doDeployContract()   {
    // Reset the deployment results UI
    //resetDeploymentResultUI();

    var     abiDefinitionString = compiledAbiDefinition;
    var     abiDefinition = JSON.parse(abiDefinitionString);

    var     bytecode = compiledBytecode;

    // 1. Create the contract object
    var  contract = web3.eth.contract(abiDefinition);

    // Get the estimated gas
    var   gas = 4700000;

    // 2. Create the params for deployment - all other params are optional, uses default
    var  params = {
        from: web3.eth.coinbase,
        data: bytecode,
        gas: gas
    }

    // 3. This is where the contract gets deployed
    // Callback method gets called *2* 
    // First time : Result = Txn Hash
    // Second time: Result = Contract Address
    var constructor_param = 10;

    contract.new(constructor_param,params,function(error,result){

        if(error){
            setData('contracttransactionhash','Deployment Failed: '+error,true);
        } else {
            console.log('RECV:',result)
            if(result.address){
                document.getElementById('contract_address').value=result.address;
                setEtherscanIoLink('contractaddress_link','address',result.address);
            } else {
                // gets set in the first call
                //setData('contracttransactionhash',result.transactionHash, false);
                //setEtherscanIoLink('contracttransactionhash_link','tx',result.transactionHash);
            }
        }
    });
}


    
