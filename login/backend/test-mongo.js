const mongoose = require('mongoose');

const uri = "mongodb://agrim547_db_user:Lywpfdl7sqDTVHrp@ac-a80n19f-shard-00-00.tm37gzq.mongodb.net:27017,ac-a80n19f-shard-00-01.tm37gzq.mongodb.net:27017,ac-a80n19f-shard-00-02.tm37gzq.mongodb.net:27017/?ssl=true&replicaSet=atlas-s0lg81-shard-0&authSource=admin&appName=Cluster0";

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Success! Connected using mongodb://");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  });
