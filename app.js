import express, { response } from 'express';
import bodyParser from 'body-parser';
import { VIVA_URL } from './src/utils/data.js';
import dotenv from 'dotenv'
import axios from 'axios';
import cors from 'cors';

const WEBHOOK_TOKEN_URL = "https://demo.vivapayments.com/api/messages/config/token"

const app = express();

app.use(express.static("public"));
app.use(express.raw());
app.use(bodyParser.json());

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: false,
  }));
  
dotenv.config();

app.get('/api/hello', (req, res) => {
    res.send('Hello, World!');
});

app.post('/init-payment', async(req, res) => {
    const data = req.body;
  
    // Example validation
    if (!data.amount || !data.customerTrns || !data.customer || !data.customer.email || !data.customer.fullName || !data.customer.requestLang) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Create a new order in viva payment with data
    try {
        const token = await getVivaAccessToken()
        const response = await createVivaOrder(data, token.token)
        res.json({ success: true, message: 'Payment processed successfully', data: response.order });
        
    } catch (error) {
        
    }
    
});
app.get('/viva-webhook', async(req, res) => {
  // if (steps.webhookEndpoint.event.method === 'POST') {
  //   console.dir(steps.webhookEndpoint.event.body);
  //   return {
  //     statusCode: 200,
  //     body: JSON.stringify({ message: 'ok' })
  //   };
  // }

  try {
    const merchantId = process.env.VIVA_MERCHANT_ID;
    const apiKey = process.env.VIVA_API_KEY;
    const credentials = btoa(`${merchantId}:${apiKey}`);

    const resp = await axios({
      method: "GET",
      url: WEBHOOK_TOKEN_URL,
      headers: {
        "Authorization": `Basic ${credentials}`
      }
    });

    const code = resp.data.Key;

    console.log('Le webhook a été validé');
    
    return res.json({ Key: code });
  } catch (error) {
    console.error('Erreur lors de la validation du webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur lors de la validation du webhook' })
    };
  }
    
});




// Routes
const getVivaAccessToken = async() => {
  // Viva Wallet API credentials
  const clientId = process.env.VIVA_CLIENT_ID
  const clientSecret = process.env.VIVA_CLIENT_SECRET
  const basicAuth = btoa(`${clientId}:${clientSecret}`);
  try {
    // Authenticate using Basic Authentication
    const authHeader = `Basic ${basicAuth}`;
    
    // Make a request to obtain an access token
    const tokenUrl = `https://demo-accounts.vivapayments.com/connect/token`;

    const tokenResponse = await axios.post(tokenUrl, {
      grant_type: 'client_credentials'
    }, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    });
    if (tokenResponse.status === 200) {
        return { token: tokenResponse.data.access_token };
      } else {
        throw new Error(`Failed to get access token. Status code: ${tokenResponse.status}`);
      }
    } catch (error) {
      console.error('Error:', error.response);
      throw new Error('Error occurred while getting access token');
    }
}

const createVivaOrder = async (data, token) => {
    try {
      // Make a request to create a new order
      const orderUrl = `${VIVA_URL}/checkout/v2/orders`;
  
      const orderResponse = await axios.post(orderUrl, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (orderResponse.status === 200) {
        return {
            order: orderResponse.data
        };
      } else {
        throw new Error(`Failed to create Viva order. Status code: ${orderResponse.status}`);
      }
    } catch (error) {
      console.error('Error:', error.response);
      throw new Error('Error occurred while creating Viva order');
    }
  };
export default app