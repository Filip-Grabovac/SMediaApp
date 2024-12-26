// // Function to fetch city data from the API
// function fetchCityData(apiUrl) {
//   return fetch(apiUrl)
//     .then((response) => response.json())
//     .catch((error) => {
//       console.error('Error fetching city data:', error);
//     });
// }

// // Function to fetch detailed data for a specific place and state
// function fetchDetailedData(stateNumber, placeNumber) {
//   const detailedApiUrl = `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E,B19013_001E,B25024_002E,B25077_001E&for=place:${placeNumber}&in=state:${stateNumber}&key=a056908496d8c3dfc4c95509c6165e2904b8e00f`;

//   return fetch(detailedApiUrl)
//     .then((response) => response.json())
//     .catch((error) => {
//       console.error('Error fetching detailed data:', error);
//     });
// }

// // Function to add a row to the table
// // Function to add a row to the table
// function addRowToTable(data) {
//   const tableBody = document.querySelector('#main-data-table tbody');
//   const row = document.createElement('tr');

//   // Populate the row with data (no index column)
//   row.innerHTML = `
//           <td>${data.cityName}</td>
//           <td>${data.stateName}</td>
//           <td>${data.population}</td>
//           <td>${data.avgHouseholdIncome}</td>
//           <td>${data.singleFamilyHomes}</td>
//           <td>${data.avgHomeValue}</td>
//           <td>${data.totalHomeValue}</td>
//           <td>${data.closestOfficeMiles}</td>
//           <td>${data.percentOfTotalPop}</td>
//           <td>${data.cumulativePop}</td>
//           <td>${data.totalPopulation}</td>
//           <td>${data.normPop}</td>
//           <td>${data.normAvgHouseholdIncome}</td>
//           <td>${data.normSingleFamilyHomes}</td>
//           <td>${data.normAvgHomeValue}</td>
//           <td>${data.normClosestOffice}</td>
//           <td>${data.weightedScore}</td>
//       `;

//   tableBody.appendChild(row);
// }

// // Function to handle the table data fetching and population
// document.querySelector('.submit-selection').addEventListener('click', () => {
//   const stateValue = '08';
//   const apiUrl = `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=place:*&in=state:${stateValue}&key=a056908496d8c3dfc4c95509c6165e2904b8e00f`;

//   fetchCityData(apiUrl).then((generatedCities) => {
//     const promises = [];

//     // Limit to the first 191 cities (slice from index 1 to 192)
//     generatedCities.slice(1, 192).forEach((city, index) => {
//       const cityName = city[0];
//       const stateNumber = city[1];
//       const placeNumber = city[2];

//       const promise = fetchDetailedData(stateNumber, placeNumber).then(
//         (cityDetails) => {
//           if (
//             cityDetails[1][1] == -666666666 ||
//             cityDetails[1][2] == -666666666 ||
//             cityDetails[1][3] == -666666666 ||
//             cityDetails[1][4] == -666666666
//           ) {
//             return; // Skip invalid data
//           }

//           const cityData = {
//             cityName: cityName,
//             stateName: 'Colorado', // Hardcoded state name, can be dynamic if needed
//             population: cityDetails[1][1], // Adjust based on API response structure
//             avgHouseholdIncome: cityDetails[1][2], // Adjust accordingly
//             singleFamilyHomes: cityDetails[1][3], // Adjust accordingly
//             avgHomeValue: cityDetails[1][4], // Adjust accordingly
//             totalHomeValue: '', // Adjust accordingly
//             closestOfficeMiles: '', // Adjust accordingly
//             percentOfTotalPop: '', // Adjust accordingly
//             cumulativePop: '', // Adjust accordingly
//             totalPopulation: '', // Adjust accordingly
//             normPop: '', // Adjust accordingly
//             normAvgHouseholdIncome: '', // Adjust accordingly
//             normSingleFamilyHomes: '', // Adjust accordingly
//             normAvgHomeValue: '', // Adjust accordingly
//             normClosestOffice: '', // Adjust accordingly
//             weightedScore: '', // Adjust accordingly
//           };

//           addRowToTable(cityData);
//         }
//       );

//       promises.push(promise);
//     });

//     // Wait for all city data to be fetched
//     Promise.all(promises).then(() => {
//       console.log('All city data has been fetched and populated');

//       // Initialize the DataTable without pagination
//       $('#main-data-table').DataTable({
//         dom: 't', // Only the table (no pagination or other controls)
//         ordering: true, // Enable ordering for the table overall
//         columnDefs: [
//           { orderable: false, targets: 0 }, // Disable ordering for the first column (now not needed)
//           { type: 'string', targets: [1, 2] }, // Enable string ordering for the 2nd and 3rd columns
//           { type: 'num', targets: '_all' }, // Enable numeric ordering for all other columns
//         ],
//         order: [[1, 'asc']], // Optional: Set the default initial sort column
//         paging: false, // Disable pagination
//       });

//       console.log('DataTable initialized successfully');
//     });
//   });
// });

// NEW CODE

document
  .querySelector('.submit-selection')
  .addEventListener('click', async () => {
    const stateFips = '01'; // Static FIPS code for Washington, D.C.
    const placeFips = '07000'; // Static FIPS code for Washington, D.C.
    const apiKey = 'a056908496d8c3dfc4c95509c6165e2904b8e00f'; // Replace with your Census API key

    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,B01003_001E,B19013_001E,B25024_002E,B25077_001E&for=place:${placeFips}&in=state:${stateFips}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

      const data = await response.json();
      const [headers, values] = data;

      const cityName = values[0];
      const population = values[1];
      const avgIncome = values[2];
      const singleFamilyHomes = values[3];
      const avgHomeValue = values[4];

      alert(`
      City: ${cityName}
      Population: ${population}
      Average Household Income: $${avgIncome}
      Approx. # of Single-Family Homes: ${singleFamilyHomes}
      Average Home Value: $${avgHomeValue}
    `);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data. See console for details.');
    }
  });
