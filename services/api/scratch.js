import app from './src/server.js';
import request from 'supertest';
import { RationTransaction } from './src/models/RationTransaction.js';

RationTransaction.findOne = async () => ({ transactionId: 'TXN-001', status: 'COMPLETED' });

request(app)
  .post('/api/v1/auth/reverify')
  .send({
    transactionRef: 'TXN-001',
    fingerprint: { outcome: 'SUCCESS' },
    face: { outcome: 'SUCCESS' },
    iris: { outcome: 'SUCCESS' }
  })
  .then(res => {
    console.log(res.status);
    console.log(res.body);
    process.exit(0);
  });
