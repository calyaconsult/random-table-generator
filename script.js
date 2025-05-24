const mkCell = (x, type, row, column) => {
  let cellClass = (isNaN(x)) ? 'nan' : 'numeric';
  if ((row == 3 || row >= 13) && column > 2) cellClass = cellClass + ' calc';
  let cellContent = (type == 'td') ? fillCell(x, row, column) : x; // Pass column for context if needed later, though not used now for formatting
  return `<${type} data-cellcontent="${x}" class="${cellClass}" id="r${row}c${column}">${cellContent}</${type}>`
};

const fillCell = (x, row) => {
  // Check if x is a number and if the row is one that needs formatting.
  // The row numbers correspond to the displayed table rows:
  // Row 3: "Veränderung" for totals
  // Row 6: "Pageviews/Visit"
  // Rows 13, 14, 15: "Veränderung" for devices
  const rowsToFormat = [3, 6, 13, 14, 15];
  if (!isNaN(parseFloat(x)) && isFinite(x) && rowsToFormat.includes(row)) {
    // Ensure x is treated as a number for toFixed()
    // The CSS class `rc-v > td.numeric::after { content: "%"; ... }` handles adding '%'
    return Number(x).toFixed(2);
  }
  return x; // Return original value if no formatting is applied
};

const chainCells = (t, r) => {
  const colCounter = counter(0);
  return (newRow, x) => { return newRow + mkCell(x, t, r, colCounter()) };
};

const counter = (init) => {
  var i = init;
  return () => {
    i += 1;
    return i;
  }
};

let colCounter = counter(-1); // Can't be constant if the assignment is repeated in line 75!

const mkRow = (arr, type) => {
  let rn = colCounter();
  let dummy = [''];
  let rowClass = 'none';
  
  switch (arr[0]) {
    case "Veränderung": rowClass = 'rc-v'; break;
    case "{BLANK}": rowClass = 'rc-b'; break;
    default: rowClass = 'rc-d'; break;
  }
  
  return `<tr class="${rowClass}" id="row-${rn}"><${type} class="rownr">${rn}</${type}>${[...dummy, ...arr].reduce(chainCells(type, rn))}</tr>`; // [...[''],...arr] ist äquivalent zu arr.unshift('dummy'); arr
};

// var monthName = "Nov"; // Removed as month selection is now dynamic
// var month = "Aug,Sep,Oct,Nov,Dec".split(",").indexOf(monthName); // Removed

$("document").ready(function() {
  $.getJSON("months-generated-values.json", function(allData) { // Align file name with existing file
    const monthSelect = $("#month-select");
    monthSelect.empty(); // Clear existing options

    allData.forEach((monthData, index) => {
      // Extract month and year, expected at monthData[1][1] (e.g., "Nov 2023")
      const monthYearString = monthData[1][1]; 
      const option = $("<option></option>")
        .val(index)
        .text(monthYearString);
      monthSelect.append(option);
    });

    // Set default selection to the last month
    const defaultMonthIndex = allData.length - 1;
    monthSelect.val(defaultMonthIndex);

    // Function to load table data for a specific month index
    function loadTableForMonth(monthIndex) {
      colCounter = counter(-1); // Reset column counter for each table load
      var data = allData[monthIndex];
      
      // Clear previous table content
      $("#maintable > thead").empty();
      $("#maintable > tbody").empty();

      let c = counter(0); // Reset row counter for the header
      // Add a header row with column numbers
      $("#maintable > thead").append(mkRow(Array(data[0].length-1).fill(1).map((x) => { return c() }), "th"));


      const rows = data.length;
      var matrix = [];
      var rotatedMatrix = [];
      for (let dataRow = 0; dataRow < rows; dataRow++) {
        matrix.push(data[dataRow].flat());
      }

      for (let r = 0; r < matrix[0].length; r++) {
        let row = [];
        for (let c = 0; c < matrix.length; c++) {
          row.push(matrix[c][r]);
        }
        rotatedMatrix.push(row);
        if (r == 0) { // This is the main header row from data
          $("#maintable > thead").append(mkRow(row, "th"));
        } else {
          if (row[0] == "{BLANK}") row = row.map((x) => { return '&nbsp;'; });
          $("#maintable > tbody").append(mkRow(row, "td"));
        }
      }
      // console.log(rotatedMatrix); // Optional: for debugging

      // Re-apply any necessary post-processing like adding classes
      $("#maintable > thead > tr:nth-child(1) > th").each(function() { $(this).addClass("colnr") });
    }

    // Initial load of the default month's data
    loadTableForMonth(defaultMonthIndex);

    // Event listener for dropdown change
    monthSelect.on("change", function() {
      loadTableForMonth(parseInt($(this).val(), 10));
    });

  }).then(function() {
    // This .then() might still be useful for global post-processing if any
    // For now, ensuring the colnr class is applied within loadTableForMonth
  }).fail(function(jqXHR, textStatus, errorThrown) {
    console.error("Error loading JSON data: " + textStatus, errorThrown);
    // Optionally display an error message to the user
    $("#infotext").html("Error loading monthly data. Please try again later.");
  });
});
