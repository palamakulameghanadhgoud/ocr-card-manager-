import { MongoMemoryServer } from 'mongodb-memory-server';

async function start() {
  console.log('Spinning up temporary in-memory MongoDB database...');
  try {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'answer-paper-correction',
      },
    });

    const uri = mongod.getUri();
    console.log('\n======================================================');
    console.log('   TEMPORARY MONGODB SERVER STARTED SUCCESSFULLY!   ');
    console.log('======================================================');
    console.log(`URI  : ${uri}`);
    console.log(`Port : 27017`);
    console.log(`DB   : answer-paper-correction`);
    console.log('\nKeep this terminal open while testing the application.');
    console.log('Press Ctrl+C to stop the database server.');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Failed to start in-memory MongoDB:', err);
    process.exit(1);
  }
}

start();
