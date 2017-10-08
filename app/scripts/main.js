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
var nodeType = 'geth';
var compiledBytecode = '0x6060604052341561000f57600080fd5b6104548061001e6000396000f300606060405263ffffffff7c010000000000000000000000000000000000000000000000000000000060003504166362777662811461005d5780638c659ab7146100e757806390281af714610123578063bd5b38371461017657600080fd5b341561006857600080fd5b61007061019b565b60405160208082528190810183818151815260200191508051906020019080838360005b838110156100ac578082015183820152602001610094565b50505050905090810190601f1680156100d95780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34156100f257600080fd5b6100fa610244565b60405173ffffffffffffffffffffffffffffffffffffffff909116815260200160405180910390f35b341561012e57600080fd5b61017460046024813581810190830135806020601f8201819004810201604051908101604052818152929190602084018383808284375094965061026095505050505050565b005b341561018157600080fd5b610189610370565b60405190815260200160405180910390f35b6101a361037e565b60008054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156102395780601f1061020e57610100808354040283529160200191610239565b820191906000526020600020905b81548152906001019060200180831161021c57829003601f168201915b505050505090505b90565b60025473ffffffffffffffffffffffffffffffffffffffff1690565b6000818051610273929160200190610390565b506002805473ffffffffffffffffffffffffffffffffffffffff19163373ffffffffffffffffffffffffffffffffffffffff90811691909117918290554260018190559116907f857c34e4001772a5072bf658ae029d6ffc4707b95a1c5e3aed41e673accc0e0f90600090604051602081018290526040808252835460026000196101006001841615020190911604908201819052819060608201908590801561035e5780601f106103335761010080835404028352916020019161035e565b820191906000526020600020905b81548152906001019060200180831161034157829003601f168201915b5050935050505060405180910390a250565b600154603c42919091030490565b60206040519081016040526000815290565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106103d157805160ff19168380011785556103fe565b828001600101855582156103fe579182015b828111156103fe5782518255916020019190600101906103e3565b5061040a92915061040e565b5090565b61024191905b8082111561040a57600081556001016104145600a165627a7a723058204fcb46b048457b98c15831a707a60b38e4c73b40c2c413757dd7c249af04583e0029';
var compiledAbiDefinition = '[{"constant":true,"inputs":[],"name":"currentName","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"fromAddres","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"yourName","type":"string"}],"name":"interact","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"lastUpdatedMinutes","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"name","type":"string"},{"indexed":true,"name":"addr","type":"address"},{"indexed":false,"name":"timeUpdated","type":"uint256"}],"name":"Interaction","type":"event"}]';
var contractAddress = '0x59b1cdf1c3f4fd01d9f7a9a28ba694ea6ce217b6'
var estimatedGas = 4700000;

/**
 * Listener for load
 */
window.addEventListener('load', function() {
  // Now you can start your app & access web3 freely:
  startApp()

})


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
            document.getElementById('account').value=accounts;
            console.log("Get Accounts result: " + accounts);

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
 * Deploys the contract - ASYNCH
 */

function    doDeployContract()   {
    var     abiDefinitionString = compiledAbiDefinition;
    var     abiDefinition = JSON.parse(abiDefinitionString);

    var     bytecode = compiledBytecode;

    // 1. Create the contract object
    var  contract = web3.eth.contract(abiDefinition);

    // Get the estimated gas
    var   gas = estimatedGas;

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
                console.log("Contract address: " + result.address);
            } else {
                console.log("Transaction HASH: " + result);
            }
        }
    });
}

function    doInteract() {
    // creating the cntract instance
    var instance = createContractInstance();
    // read the ui elements
    var parameterValue = document.getElementById('message').value;

    // Create the transaction object
    var    txnObject = {
        from: web3.eth.coinbase,
        gas: estimatedGas
    }
    instance.interact.sendTransaction(parameterValue,txnObject,function(error, result)  {

        console.log('RECVED>>',error,result);   
        if(error){
            console.log("Interact error: " + result);
        } else {
            console.log("Interact success: " + result);
        }
    });    
} 

// Utility method for creating the contract instance
function  createContractInstance(){
    var     abiDefinitionString = compiledAbiDefinition;
    var     abiDefinition = JSON.parse(abiDefinitionString);

    // Instance uses the definition to create the function
    var    contract = web3.eth.contract(abiDefinition);

    // Instance needs the address
    var    instance = contract.at(contractAddress);
    return instance;
}

/**
 * To start the event watching using the contract object
 */

function    doContractEventWatchStart() {
    
        if(contractEvent){
            doContractEventWatchStop();
        }
    
        // Reset the UI
        setData('watch_contract_instance_event_count','0',false);
    
        contractEvent = createContractEventInstance();
    
        contractEvent.watch(function(error, result){
            if(error){
                console.error('Contract Event Error');
            } else {
               
            //    console.log("Event.watch="+JSON.stringify(result))
                // increment the count watch_instance_event_count
                contractEventCounter++;
                setData('watch_contract_instance_event_count',contractEventCounter, false );
    
                addEventListItem('watch_contract_events_list',result,5);
            }
        });
    }

    /**
 * Utility method for creating an instance of the event
 */
function createContractEventInstance(){
    var contractAddress = contractAddress

    var contractInstance = createContractInstance(contractAddress);

    // geth the indexed data values JSON
    //var indexedEventValues = document.getElementById('indexed_event_values').value
    //indexedEventValues = JSON.parse(indexedEventValues)

    //var additionalFilterOptions = document.getElementById('additional_filter_event_values').value;
    //additionalFilterOptions = JSON.parse(additionalFilterOptions);

    return contractInstance.Interaction();
}