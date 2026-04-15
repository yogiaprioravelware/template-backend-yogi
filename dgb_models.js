const db = require("./src/models");
console.log("Loaded models:", Object.keys(db).filter(k => k !== "sequelize" && k !== "Sequelize"));
