#!/usr/bin/env node

/**
 * Hybrid Adaptive Sorting Algorithm Demonstration
 *
 * This demo showcases the adaptive sorting implementation that intelligently
 * selects the optimal algorithm based on data patterns.
 */

import { AdaptiveSorter, SortingBenchmark, SortingExamples } from './sorting-algorithms';

async function runDemo(): Promise<void> {
  console.log('🚀 Hybrid Adaptive Sorting Algorithm Demonstration');
  console.log('='.repeat(60));
  console.log('Approach 3 of 3: Adaptive Algorithm Selection Strategy\n');

  // 1. Show algorithm selection based on patterns
  console.log('1️⃣  Adaptive Algorithm Selection');
  console.log('-'.repeat(40));

  const demoPatterns = [
    { name: 'Nearly Sorted', data: [1, 2, 3, 5, 4, 6, 7, 8, 10, 9] },
    { name: 'Many Duplicates', data: [3, 1, 3, 2, 1, 3, 2, 1, 3, 2] },
    { name: 'Random', data: [8, 3, 7, 1, 9, 4, 6, 2, 5, 0] },
    { name: 'Reverse Sorted', data: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] },
    { name: 'Already Sorted', data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }
  ];

  demoPatterns.forEach(({ name, data }) => {
    const testArray = [...data];
    const metrics = AdaptiveSorter.adaptiveSort(testArray);

    console.log(`${name.padEnd(18)}: ${metrics.algorithmUsed.padEnd(18)} (${metrics.executionTime.toFixed(3)}ms)`);
    if (metrics.patternAnalysis) {
      const pattern = metrics.patternAnalysis;
      console.log(`                    ↳ Random: ${pattern.randomFactor.toFixed(2)}, Duplicates: ${pattern.duplicateRatio.toFixed(2)}`);
    }
  });

  // 2. Performance comparison
  console.log('\n2️⃣  Performance Comparison with Native Sort');
  console.log('-'.repeat(45));

  SortingBenchmark.compareWithNative(10000);

  // 3. Edge case robustness
  console.log('\n3️⃣  Edge Case Robustness Testing');
  console.log('-'.repeat(35));

  const edgeCases = [
    { name: 'Empty array', data: [] },
    { name: 'Single element', data: [42] },
    { name: 'All identical', data: [5, 5, 5, 5, 5] },
    { name: 'Negative numbers', data: [-3, 1, -2, 5, -1, 4] }
  ];

  edgeCases.forEach(({ name, data }) => {
    const testArray = [...data];
    const metrics = AdaptiveSorter.adaptiveSort(testArray);
    const isValid = AdaptiveSorter.validateSorted(testArray);

    console.log(`${name.padEnd(18)}: ${metrics.algorithmUsed.padEnd(15)} ${isValid ? '✓' : '✗'}`);
  });

  // 4. Custom comparison functions
  console.log('\n4️⃣  Custom Comparison Functions');
  console.log('-'.repeat(30));

  interface Product {
    name: string;
    price: number;
    rating: number;
  }

  const products: Product[] = [
    { name: 'Laptop', price: 1200, rating: 4.5 },
    { name: 'Mouse', price: 25, rating: 4.0 },
    { name: 'Keyboard', price: 75, rating: 4.2 },
    { name: 'Monitor', price: 300, rating: 4.8 }
  ];

  // Sort by price
  const byPrice = [...products];
  const priceMetrics = AdaptiveSorter.adaptiveSort(byPrice, (a, b) => a.price - b.price);
  console.log(`Sort by Price:  ${priceMetrics.algorithmUsed} (${priceMetrics.executionTime.toFixed(3)}ms)`);
  console.log(`               ${byPrice.map(p => p.name).join(', ')}`);

  // Sort by rating (descending)
  const byRating = [...products];
  const ratingMetrics = AdaptiveSorter.adaptiveSort(byRating, (a, b) => b.rating - a.rating);
  console.log(`Sort by Rating: ${ratingMetrics.algorithmUsed} (${ratingMetrics.executionTime.toFixed(3)}ms)`);
  console.log(`               ${byRating.map(p => `${p.name}(${p.rating})`).join(', ')}`);

  // 5. Key Features Summary
  console.log('\n5️⃣  Key Features & Optimizations');
  console.log('-'.repeat(35));

  console.log('✅ Adaptive Algorithm Selection:');
  console.log('   • Insertion Sort for nearly-sorted data (O(n) best case)');
  console.log('   • 3-way Quicksort for duplicate-heavy data');
  console.log('   • HeapSort for reverse-sorted or worst-case scenarios');
  console.log('   • Introsort (QuickSort + fallbacks) for random data');

  console.log('\n✅ Performance Optimizations:');
  console.log('   • Median-of-three pivot selection');
  console.log('   • Pattern detection via sampling');
  console.log('   • Tail recursion optimization');
  console.log('   • In-place sorting (O(1) space complexity)');

  console.log('\n✅ Robustness Features:');
  console.log('   • Comprehensive error handling');
  console.log('   • Edge case optimization');
  console.log('   • Custom comparison function support');
  console.log('   • Performance metrics and validation');

  console.log('\n✅ Algorithm Complexity:');
  console.log('   • Best Case:    O(n) for nearly-sorted data');
  console.log('   • Average Case: O(n log n) with optimal algorithm selection');
  console.log('   • Worst Case:   O(n log n) guaranteed via HeapSort fallback');
  console.log('   • Space:        O(1) additional space (in-place)');

  console.log('\n🎯 Adaptive Algorithm Selection Rules:');
  console.log('   • Nearly Sorted (randomFactor < 0.1)  → Insertion Sort');
  console.log('   • Many Duplicates (duplicateRatio > 0.2) → 3-way Quicksort');
  console.log('   • Reverse Sorted → HeapSort (avoid QuickSort worst-case)');
  console.log('   • Random Data → Introsort with depth limiting');

  console.log('\n✨ Demonstration Complete! ✨');
  console.log('\nThe adaptive sorter intelligently selects the optimal algorithm');
  console.log('based on data patterns, providing consistent performance');
  console.log('across all input scenarios while maintaining robustness.');
}

// Run the demonstration
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };