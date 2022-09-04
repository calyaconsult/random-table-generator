const fs = require('fs');
const data = JSON.parse(fs.readFileSync('table-data-4.json'));
var max = 0;
for (let i=0;i<data.length;i++){
  let maxl = Math.max(...[data[i][3],data[i][13],data[i][14],data[i][15]].map((x) => {return (isNaN(x))? 0 : Number(x);}));
  max = (max >= maxl) ? max : maxl;
}
console.log(max);
