import { mergeSort, parallelMergeSort, testMergeSort } from './sorting-algorithms.js';

// Test the basic functionality
console.log('=== Testing MergeSort Implementation ===\n');

// Run the basic tests
testMergeSort();

// Test parallel functionality with a larger array
async function testParallel() {
    console.log('=== Testing Parallel MergeSort ===\n');

    // Create a large test array
    const testArray = Array.from({ length: 15000 }, () => Math.floor(Math.random() * 10000));
    const arrayCopy1 = [...testArray];
    const arrayCopy2 = [...testArray];

    console.log('Testing with 15,000 random elements...\n');

    // Test standard merge sort
    console.log('Standard MergeSort:');
    const standardStart = performance.now();
    const standardResult = mergeSort(arrayCopy1);
    const standardTime = performance.now() - standardStart;
    console.log(`Time: ${standardTime.toFixed(2)}ms`);

    // Test parallel merge sort
    console.log('\nParallel MergeSort:');
    const parallelStart = performance.now();
    const parallelResult = await parallelMergeSort(arrayCopy2);
    const parallelTime = performance.now() - parallelStart;
    console.log(`Time: ${parallelTime.toFixed(2)}ms`);

    // Verify results are identical
    const resultsMatch = JSON.stringify(standardResult) === JSON.stringify(parallelResult);
    console.log(`\nResults match: ${resultsMatch ? '✓' : '✗'}`);

    if (standardTime > 0) {
        const speedup = standardTime / parallelTime;
        console.log(`Speedup: ${speedup.toFixed(2)}x`);
    }

    // Verify sorted correctly
    const isSorted = parallelResult.every((val, i) => i === 0 || val >= parallelResult[i - 1]);
    console.log(`Correctly sorted: ${isSorted ? '✓' : '✗'}`);
}

// Run the tests
testParallel().then(() => {
    console.log('\n=== Test completed successfully! ===');
}).catch(error => {
    console.error('Test failed:', error);
});