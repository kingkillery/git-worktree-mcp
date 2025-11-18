import { runBenchmarks } from './sorting-algorithms.js';

console.log('Starting comprehensive MergeSort benchmarks...\n');

// Run the comprehensive benchmark suite
runBenchmarks().then(() => {
    console.log('\n=== All benchmarks completed! ===');
}).catch(error => {
    console.error('Benchmark failed:', error);
});