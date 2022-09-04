const fs = require('fs');
const syntheticData = JSON.parse(fs.readFileSync('../synthetic-data/data/test.json'));
const itemsInGroup = 4;
const groups = 4;
var synthVals = [];
var data = JSON.parse(fs.readFileSync('./table-data.json'));
const colNames = Object.keys(syntheticData[0]);
var randomSet;
for (let rs=0;rs<7;rs++) {
  randomSet = Math.floor(Math.random()*syntheticData.length);
  synthVals.push(syntheticData[randomSet]);
  console.log(`== ${rs} RS ${randomSet} ==`);
  /*for (let x=0;x<colNames.length;x++) {
    coln = colNames[x];
    console.log(x,coln,syntheticData[randomSet][coln]);
  }*/
}
console.log(`*** Synth Vals: ${JSON.stringify(synthVals)}`);
console.log("\n");
const lastCol = 8;
for (let i=2;i<lastCol;i++) {
  console.log("\n",i,data[i][0]);
  for (let g=0;g<groups;g++) {
    let sv = '--';
    console.log(`Group ${g}`);
    for (let item=0;item<itemsInGroup;item++) {
      let itemVal = data[i][0];
      if (item==3) {itemVal = '{BLANK}';} else {
        let sv = (g-1)*3+item;
        let svt = `synthVals[${sv}]`;
        if (typeof synthVals[sv] == "undefined") continue;
        let name = Object.keys(synthVals[sv])[i-1];
        let sval = synthVals[sv][name];
        console.log(`Coords: ${[i]}:${g*4+item+1}`);
        console.log("V",data[i][g*4+item+1]);
        data[i][g*4+item+1] = sval;
        console.log("N",data[i][g*4+item+1]);
        itemVal += (g==0 || g==3) ? ' calc' : ` ${sval} (${name})`;
      };
      console.log(`Item ${item}: ${itemVal}`);
    }
  }
}
//console.log(data);
var table = data;

var calcRows = table[0].map((x, i) => { if (x == "VerÃ¤nderung") return i; }).filter((x) => { return x }); // Welche Zeilen nehmen berechnete Ergebnisse auf?

var offsets = [[2, 1], ...Array(3).fill([8, 4])];

for (let col = 2; col < table.length - 1; col++) {
  // FÃ¼llen der Total-Zeilen mit der Summe der Detailzeilen
  let distanceToDetail = 4; // Anzahl Zeilen zwischen erster Summezeile und erster Zeile der Details
  let numberOfDetails = 3; // Anzahl von Zeilen mit Detaildaten
  let offsetSumIndexPosition = 0; // Position der Zeile vor der ersten Summenzeile
  for (let i = 1; i < 3; i++) {
    let s1 = i + distanceToDetail + numberOfDetails * (i - 1);
    let s2 = i + distanceToDetail + numberOfDetails * i;
    table[col][i + offsetSumIndexPosition] = table[col].slice(s1, s2).reduce((partialSum, a) => partialSum + a, 0);
  };

  // Berechnung der prozentualen VerÃ¤nderung
  for (let i = 0; i < calcRows.length; i++) {
    let cri = calcRows[i];
    let r1i = calcRows[i] - offsets[i][0];
    let r2i = calcRows[i] - offsets[i][1];
    let data1 = table[col][r1i];
    let data2 = table[col][r2i];
    //col,cri,r1i,r2i,
    let perc = Number(((data1 / data2 - 1) * 100).toFixed(2));
    //console.log(data1,data2,`${perc}%`);
    table[col][calcRows[i]] = perc;
  }
}

// Als letzter Schritt werden horizontale AbhÃ¤ngigkeinten aufgelÃ¶st.
// Im konkreten Beispiel wird in Spalte 6 der Quotient Spalte 5/Spalte 4 eingetragen

let h = [3,4,5];
for (let row=1;row<16;row++) {
  if (!isNaN(table[h[1]][row])) table[h[2]][row] = Number((table[h[1]][row]/table[h[0]][row]).toFixed(2));
}

// NachtrÃ¤gliche Anpassung der prozentualen VerÃ¤nderung
// In der Spalte "Pageviews/Visit"

table[5][3] = ((table[5][1]/table[5][2]-1)*100).toFixed(2);
table[5][13] = ((table[5][5]/table[5][9]-1)*100).toFixed(2);
table[5][14] = ((table[5][6]/table[5][10]-1)*100).toFixed(2);
table[5][15] = ((table[5][7]/table[5][11]-1)*100).toFixed(2);

fs.writeFileSync(`output.json`, JSON.stringify(table,null,2));
