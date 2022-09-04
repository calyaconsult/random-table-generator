const fs = require('fs');
const syntheticData = JSON.parse(fs.readFileSync('../synthetic-data/data/test.json'));
const colNames = Object.keys(syntheticData[0]);

const year = 2022;
const prevYear = year-1;
const month = 7;
const monthnames = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(",");

var synthVals = {};
var randomSet;

const groupMembers = "desktop,mobile,tablet".split(",");
const numberOfGroupMembers = groupMembers.length;
const numberOfGroups = 2;

const createAccu = (template) => {
  accu = template;
  for (let i=0;i<Object.keys(template).length;i++) {
    accu[Object.keys(template)[i]] = 0;
  };
  return accu;
};

const calcRatio = (x,y,z) => {
  return(isNaN(x) || isNaN(y)) ? z : x/y; 
};

const getLiveData = (arr) => {
  return arr.map((x) => x.split(",").map((x) => {return (isNaN(x))? x : Number(x);}));
};

const liveDataRaw = [
  "desktop,767,1107,7498,6.773261066,24.76044437,143.068654",
  "mobile,408,546,2364,4.32967033,23.81243124,79.31684982",
  "tablet,10,14,68,4.857142857,38.12962963,146.9285714",
  "desktop,1526,1821,9598,5.270730368,28.44130127,121.5442065",
  "mobile,267,417,2169,5.201438849,22.97317352,96.53477218",
  "tablet,27,38,238,6.263157895,31.935,168.2894737"
]

const liveData = getLiveData(liveDataRaw);

var accumulator;
for (let rs=0;rs<numberOfGroupMembers*numberOfGroups;rs++) {
  let group = (rs<numberOfGroupMembers) ? 'currentYear' : 'previousYear';
  if (rs%numberOfGroupMembers == 0)  {
     synthVals[group] = {"Data" : {}};
     accumulator = createAccu(syntheticData[0]);
  };

  liveSet = colNames.reduce((ac, element, index) => {
              return {...ac, [element]: liveData[rs][index]};
            }, {});
  //console.log("L:",liveSet)

  randomSet = Math.floor(Math.random()*syntheticData.length);
  //console.log("R:",syntheticData[randomSet]);

  let row = liveSet;
  //let row = syntheticData[randomSet];

  /*** Die Ratio "Pages / Session" mus berechnet werden, da die Datenquelle die Abhängikeit dieser Zahl nicht kennt und stattdessen eine Zufallszahl liefert  ***/
  row["Pages / Session"] = calcRatio(row["Pageviews"],row["Sessions"],row["Pages / Session"]);
  //console.log(row);
  let groupMember = groupMembers[rs%numberOfGroupMembers];
  row["Date"] = (group == 'currentYear') ? `${month} ${year}` : `${month} ${prevYear}`;
  accumulator["Date"] = row["Date"];
  synthVals[group]["Data"][groupMember] = row;
  for (let i=0;i<Object.keys(accumulator).length;i++) {
    let cellName = Object.keys(accumulator)[i];
    if (isNaN(accumulator[cellName])) {
      // Skip
    } else {
      accumulator[cellName] += row[cellName];
    };
  };
  //console.log(accumulator);
  //console.log(`== ${rs} RS ${randomSet} ==`);
  synthVals[group]["Group Total"] = JSON.parse(JSON.stringify(accumulator));
}

const groups = ["currentYear","previousYear"];
for (let g=0;g<2;g++) {
  const group = groups[g];
  if (typeof synthVals[group]["Group Total"] != "undefined") {
    synthVals[group]["Group Total"]["Pages / Session"] = calcRatio(synthVals[group]["Group Total"]["Pageviews"],synthVals[group]["Group Total"]["Sessions"],synthVals[group]["Group Total"]["Pages / Session"]);
  };
};

const getDelta = (x,y) => {
  if (isNaN(x) || isNaN(y)) return null;
  return ((x/y-1)*100).toFixed(2);
};

const calcDeltas = (k,x,y) => {
  let deltas =  x.map((e, i) => { return Number(getDelta(x[i],y[i]));});
  const obj =  k.reduce((ac, element, index) => {
     return {...ac, [element]: deltas[index]};
  }, {});
  return obj;
};

synthVals["Deltas"] = {};
for (let gm=0;gm<numberOfGroupMembers;gm++) {
  let currentMember = groupMembers[gm];
  //console.log(groupMembers[gm]);
  let n = Object.keys(synthVals["currentYear"]["Data"][currentMember]);
  let a = Object.values(synthVals["currentYear"]["Data"][currentMember]);
  let b = Object.values(synthVals["previousYear"]["Data"][currentMember]);
  //console.log(calcDeltas(n,a,b),"\n");
  synthVals["Deltas"][groupMembers[gm]] = calcDeltas(n,a,b);
}
let n = Object.keys(synthVals["currentYear"]["Group Total"]);
let a = Object.values(synthVals["currentYear"]["Group Total"]);
let b = Object.values(synthVals["previousYear"]["Group Total"]);
//console.log("Delta Total");
//console.log(calcDeltas(n,a,b),"\n");
synthVals["Deltas"]["Grand Total"] = calcDeltas(n,a,b);

console.log(JSON.stringify(synthVals,null,2));
//console.log(`*** Synth Vals: ${JSON.stringify(synthVals,null,2)}`);
//console.log("\n");
