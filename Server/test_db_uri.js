import mongoose from "mongoose";
try {
  const uri = "mongodb://dilshan06akalanka2003_db_user:dilshan06%402003gmail@ac-emnchok-shard-00-00.i2jhikf.mongodb.net:27017,ac-emnchok-shard-00-01.i2jhikf.mongodb.net:27017,ac-emnchok-shard-00-02.i2jhikf.mongodb.net:27017/?ssl=true&replicaSet=atlas-emnchok-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
  console.log("Trying to connect...");
  await mongoose.connect(uri);
  console.log("Connection successful!");
  process.exit(0);
} catch (e) {
  console.error("Connection Error:", e.message);
  process.exit(1);
}
