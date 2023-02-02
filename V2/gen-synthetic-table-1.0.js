/*
 Code from gen-synthetic-table-explained.js without comments and explanations
*/
const fs = require('fs');
const syntheticData = JSON.parse(fs.readFileSync('../synthetic-data/data/test.json'));
const colNames = Object.keys(syntheticData[0]);
const colsWithAverages = colNames.filter(x => x.match(/^Avg/));
const year = 2022;
const prevYear = year-1;
const month = 12;
const monthnames = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(",");
const groupMembers = "desktop,mobile,tablet".split(",");
const groupNames = ['currentYear','previousYear'];
const numberOfGroupMembers = groupMembers.length;
const numberOfGroups = 2;

const createAccu = (template) => {
  const accu = JSON.parse(JSON.stringify(template));
  for (let i=0;i<Object.keys(template).length;i++) {
    accu[Object.keys(template)[i]] = 0;
  };
  return accu;
};

const createAccuAlt = (keyList) => {
  const accu = {};
  for (let i=0;i<keyList.length;i++) {
    accu[keyList[i]] = 0;
  };
  return accu;
};

const calcRatio = (x,y,z) => {
  return(isNaN(x) || isNaN(y) || y == 0) ? z : x/y;
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

var synthVals = {};
var accumulator;

for (let rs=0;rs<numberOfGroupMembers*numberOfGroups;rs++) {
  let positionInGroup = rs%numberOfGroupMembers;
  let groupMember = groupMembers[positionInGroup];
  let groupNumber = Math.floor(rs/numberOfGroupMembers);
  let currentGroup = groupNames[groupNumber];
  if (positionInGroup == 0)  {
     synthVals[currentGroup] = {"Data" : {}};
     accumulator = createAccu(syntheticData[0]);
  };
  let randomIndex = Math.floor(Math.random()*syntheticData.length);
  let row = syntheticData[randomIndex];
  row["Pages / Session"] = calcRatio(row["Pageviews"],row["Sessions"],row["Pages / Session"]);
  row["Date"] = (currentGroup == 'currentYear') ? `${month} ${year}` : `${month} ${prevYear}`;
  accumulator["Date"] = row["Date"];
  synthVals[currentGroup]["Data"][groupMember] = row;
  for (let i=0;i<Object.keys(accumulator).length;i++) {
    let cellName = Object.keys(accumulator)[i];
    if (isNaN(accumulator[cellName])) {
      // Skip if cell has non-numeric content, such as '1 2021'
    } else {
      accumulator[cellName] += row[cellName];
      // If cell content is numeric we accumulate
    };
  };
  synthVals[currentGroup]["Group Total"] = JSON.parse(JSON.stringify(accumulator));
};

for (let g=0;g<groupNames.length;g++) {
  const group = groupNames[g];
  if (typeof synthVals[group]["Group Total"] != "undefined") {
    synthVals[group]["Group Total"]["Pages / Session"] =
      calcRatio(synthVals[group]["Group Total"]["Pageviews"],
                synthVals[group]["Group Total"]["Sessions"],
                synthVals[group]["Group Total"]["Pages / Session"]
               );
  };
};

for (let c=0;c<colsWithAverages.length;c++) {
  const colName = colsWithAverages[c];
  for (let g=0;g<groupNames.length;g++) {
    const group = groupNames[g];
    const accVal = synthVals[group]["Group Total"][colName];
    synthVals[group]["Group Total"][colName] = accVal/numberOfGroupMembers;
    // console.log(group,colName,accVal,synthVals[group]["Group Total"][colName]);
  };
};

synthVals["Deltas"] = {};
for (let gm=0;gm<numberOfGroupMembers;gm++) {
  let currentMember = groupMembers[gm];
  let n = Object.keys(synthVals["currentYear"]["Data"][currentMember]);
  let a = Object.values(synthVals["currentYear"]["Data"][currentMember]);
  let b = Object.values(synthVals["previousYear"]["Data"][currentMember]);
  synthVals["Deltas"][groupMembers[gm]] = calcDeltas(n,a,b);
}
let n = Object.keys(synthVals["currentYear"]["Group Total"]);
let a = Object.values(synthVals["currentYear"]["Group Total"]);
let b = Object.values(synthVals["previousYear"]["Group Total"]);
synthVals["Deltas"]["Grand Total"] = calcDeltas(n,a,b);

console.log(JSON.stringify(synthVals,null,2));
