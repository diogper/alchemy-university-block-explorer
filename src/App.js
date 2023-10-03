import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useEffect, useState } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import ListGroup from 'react-bootstrap/ListGroup';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';

import './App.css';

const settings = {
  apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};


const alchemy = new Alchemy(settings);


function App() {
  const [blockNumber, setBlockNumber] = useState("");
  const [blockTransactions, setBlockTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage] = useState(15);
  const [paginatedTxs, setPaginatedTxs] = useState([]);
  const [currentTransactionHash, setTransactionHash] = useState("");
  const [currentTransactionReceiptObj, setTransactionReceiptObj] = useState(null);
  const [currentTransactionObj, setTransactionObj] = useState(null);
  const [currentWallet, setWallet] = useState(null);
  const [currentWalletBalance, setWalletBalance] = useState(null);
  const [currentWalletTokens, setWalletTokens] = useState(null);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleKeyDownBlock = (event) => {
    if(event.key === 'Enter'){
      setBlockNumber(parseInt(event.target.value));
    }
  }

  const handleKeyDownWallet = (event) => {
    if(event.key === 'Enter'){
      setWallet(event.target.value);
    }
  }

  const selectTransaction = (event) => {
    setTransactionHash(event.target.innerHTML.split(" ")[1]);
  }

  useEffect(() => {
    async function getBlockNumber() {
      try {
        const blockN = await alchemy.core.getBlockNumber();
        setBlockNumber(blockN);

      } catch(error){
        console.error('Error fetching data:', error);
      }
    }

    getBlockNumber();

  },[]);

  useEffect(() => {

    async function getBlockTransactions(blockN) {
      try {
        const txs = (await alchemy.core.getBlock(blockN));
        setBlockTransactions(txs.transactions);
      } catch(error){
        console.error('Error fetching data:', error);
      }
    }

    if (blockNumber !== "") {
      getBlockTransactions(blockNumber);
    }
    
  }, [blockNumber]);

  useEffect(() => {

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    if(blockTransactions.length !== 0){
      // Slice the data array based on the calculated indexes
      const slicedTxs = blockTransactions.slice(startIndex, endIndex);
      setPaginatedTxs(slicedTxs);
      setTotalPages(Math.ceil(blockTransactions.length / itemsPerPage));
      // console.log(sliced);
    }
  

  }, [blockTransactions, currentPage, itemsPerPage]);

  useEffect(() => {
    async function getTransactionReceipt(tx) {
      try {
        const tx_info = await alchemy.core.getTransactionReceipt(tx);
        // console.log(await tx_info);
        setTransactionReceiptObj(tx_info);
      } catch(error){
        console.error('Error fetching data:', error);
      }
    }

    async function getTransaction(txHash) {
      try {
        const tx_info = await alchemy.core.getTransaction(txHash);
        // console.log(Utils.formatEther(tx_info.value));
        setTransactionObj(tx_info);
      } catch(error){
        console.error('Error fetching data:', error);
      }
    }
      

    if(currentTransactionHash !== ""){
      getTransactionReceipt(currentTransactionHash);
      getTransaction(currentTransactionHash);
    }
  }, [currentTransactionHash]);

  useEffect(() => {
    async function getWalletBalance(addr){
      try {
        let balance = await alchemy.core.getBalance(addr, "latest");
        // console.log(balance);
        setWalletBalance(balance);
      } catch(error){
        console.error('Error fetching data:', error);
      }
    }

    async function getWalletTokens(addr){
      try{
        const tokenBalances = await alchemy.core.getTokenBalances(addr);
        // console.log(tokenBalances);
        const tokens = tokenBalances.tokenBalances;
        console.log(tokens);
        const tokensMeta = {}
        for(let i = 0; i < tokens.length; i++){
          tokensMeta[tokens[i].contractAddress] = await alchemy.core.getTokenMetadata(tokens[i].contractAddress);
          tokensMeta[tokens[i].contractAddress].balance = tokens[i].tokenBalance;
        }
        // console.log(tokensMeta);
        // const metaData = await alchemy.core.getTokenMetadata(tokenAddresses);
        // console.log(metaData);
        setWalletTokens(tokensMeta);
        // console.log(currentWalletTokens);
        // Object.entries(currentWalletTokens).map(([key, value]) => console.log(key +':' + '|'+value.name + '|' + value.logo + '=>' + value.balance));
      } catch(error) {
        console.error('Error fetching data:', error);
      }
    }

    if(currentWallet !== null){
      getWalletBalance(currentWallet);
      getWalletTokens(currentWallet);
    }

  }, [currentWallet]);

  return (
    <div className="App">
      <Container className='main-container bg-light rounded'>
        <Row className='explorer-header'>
        <Col>
        <div className="title">
            <h1>🔗 LeetBlockExplorer</h1>
        </div>
        </Col>
        <Col>
        <div className="current-block">
            <h2> Block Number: {blockNumber}</h2>
        </div>
        </Col>
        <Col>
          <FloatingLabel
          controlId="floatingInput"
          label="Block Number"
          className="search-box"
          >
            <Form.Control 
            type="text" 
            placeholder="Block Number" 
            onKeyDown={handleKeyDownBlock}/>
          </FloatingLabel>
        </Col>
      </Row>
      <Row className="info-section">
        <Col className="transaction-list ">
          <h2>📁 Transactions List</h2>
          <ListGroup className="transactions">
            {
              paginatedTxs.map((tx, id) => <ListGroup.Item onClick={selectTransaction} key={id} action variant="primary">⛓️ {tx}</ListGroup.Item>)
            }

          </ListGroup>
          <Row className="pagination-section">
            <Col>
              <Button variant="dark" onClick={() => goToPage(currentPage - 1)}> &lt; Previous</Button>{' '}
            </Col>
            <Col>
              <span>{currentPage}</span>
            </Col>
            <Col>
            <Button variant="dark" onClick={() => goToPage(currentPage + 1)}> &gt; Next</Button>{' '}
            </Col>
          </Row>
        </Col>
        <Col className="others">
          <Row>
            <h2>🧾 Transaction Info</h2>
            <h6 className="text-primary">{currentTransactionHash}</h6>
            <Row className="transaction-info bg-light rounded">
              <Col className="transaction-info-details">
              <h6 className="text-muted">To:</h6>
              <h6 className="text-dark">{currentTransactionReceiptObj ? currentTransactionReceiptObj.to:"_"}</h6>
              </Col>
              <Col className="transaction-info-details">
              <h6 className="text-muted">From:</h6>
              <h6 className="text-dark">{currentTransactionReceiptObj ? currentTransactionReceiptObj.from:"_"}</h6>
              </Col>
              <Col className="transaction-info-details">
              <h6 className="text-muted">Confirmations:</h6>
              <h6 className="text-dark">{currentTransactionReceiptObj ? currentTransactionReceiptObj.confirmations:"_"}</h6>
              </Col>
              <Col className="transaction-info-details">
              <h6 className="text-muted">Status:</h6>
              <h6 className="text-dark">{currentTransactionReceiptObj ? currentTransactionReceiptObj.status:"_"}</h6>
              </Col>
              <Col className="transaction-info-details">
              <h6 className="text-muted">Value:</h6>
              <h6 className="text-dark">{currentTransactionObj ? Utils.formatEther(currentTransactionObj.value):"_"}</h6>
              </Col>
            </Row>
          </Row>

          <Row className="wallet-info">
          <h2>🗝️ Wallet</h2>
          <Col>
            <FloatingLabel
            controlId="floatingInput"
            label="Wallet Address"
            className="search-box"
            >
              <Form.Control 
              type="text" 
              placeholder="Wallet Address" 
              onKeyDown={handleKeyDownWallet}/>
            </FloatingLabel>
          </Col>
          </Row>
          <Row className="wallet-info-balance">
            {/* <h6 className="text-muted">Balance:</h6>
            <h6 className="text-dark">{currentWalletBalance ? Utils.formatEther(currentWalletBalance):"_"}</h6> */}
            {/* {currentWalletTokens !== null ? ( */}
            {currentWalletTokens !== null ? <ListGroup className="transactions">
            <ListGroup.Item className="erc20tokens" key='xyz' action variant="primary">
            <h6 className="text-dark"> 
              <img className="ethLogo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Ethereum_logo.svg/1285px-Ethereum_logo.svg.png" alt="Logo" style={{maxWidth: "20px"}} />
              Ether
            </h6>
            <h6>{currentWalletBalance ? Utils.formatEther(currentWalletBalance):"_"}</h6>
            
            </ListGroup.Item>
              {Object.entries(currentWalletTokens).map(([key, value]) => 
                <ListGroup.Item className="erc20tokens" key={key} action variant="primary">
                  <h6 className="text-dark"> 
                    <img className="erc20Logo" src={value.logo} alt="Logo" width="25" height="25" /> 
                    {value.name}
                  </h6> 
                  <h6>{Utils.formatEther(value.balance, value.decimals)}</h6>
                </ListGroup.Item>)}
            </ListGroup> : ""}
                
          </Row>
        </Col>
        
      </Row>
      </Container>
    </div>
  );
}

export default App;
