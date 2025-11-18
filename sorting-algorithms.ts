/**
 * Hybrid Adaptive Sorting Algorithms Implementation
 *
 * This implementation uses Introsort principles with adaptive algorithm selection
 * based on data patterns, providing optimal performance across various input scenarios.
 *
 * Approach 3 of 3: Adaptive Algorithm Selection Strategy
 *
 * Key Optimizations:
 * 1. Pattern detection for algorithm selection (nearly-sorted, duplicates, reverse-sorted)
 * 2. Introsort with depth limiting to prevent worst-case O(n²)
 * 3. Three-way Quicksort for arrays with many duplicates
 * 4. Insertion Sort for small subarrays
 * 5. Median-of-three pivot selection
 * 6. Comprehensive performance metrics and benchmarking
 */

// Types and Interfaces
type CompareFunction<T> = (a: T, b: T) => number;

interface SortingMetrics {
  algorithmUsed: string;
  comparisons: number;
  swaps: number;
  executionTime: number;
  recursionDepth: number;
  patternAnalysis?: DataPattern;
}

interface DataPattern {
  isNearlySorted: boolean;
  hasManyDuplicates: boolean;
  isReverseSorted: boolean;
  randomFactor: number; // 0 = fully sorted, 1 = completely random
  duplicateRatio: number; // proportion of duplicate elements
}

// Main Hybrid Adaptive Sort Implementation
export class AdaptiveSorter {
  private static readonly INSERTION_SORT_THRESHOLD = 16;
  private static readonly HEAP_SORT_THRESHOLD = 2 * Math.log2(32);
  private static readonly NEARLY_SORTED_THRESHOLD = 0.1; // 10% disorder tolerance
  private static readonly DUPLICATE_THRESHOLD = 0.2; // 20% duplicates for specialized handling
  private static readonly PATTERN_SAMPLE_SIZE = 100; // Sample size for pattern detection

  /**
   * Main adaptive sorting function - automatically selects best algorithm
   * based on data pattern analysis and runtime characteristics
   */
  static adaptiveSort<T>(array: T[], compareFn?: CompareFunction<T>): SortingMetrics {
    const startTime = performance.now();
    const metrics: SortingMetrics = {
      algorithmUsed: 'adaptive',
      comparisons: 0,
      swaps: 0,
      executionTime: 0,
      recursionDepth: 0
    };

    // Handle edge cases
    if (!array || array.length <= 1) {
      metrics.executionTime = performance.now() - startTime;
      metrics.algorithmUsed = 'trivial';
      return metrics;
    }

    const compare = compareFn || this.defaultCompare;
    const pattern = this.analyzePattern(array, compare);
    metrics.patternAnalysis = pattern;

    // Calculate recursion depth limit based on array size
    let maxDepth = Math.floor(Math.log2(array.length)) * 2;

    // Clone array for in-place sorting
    const workingArray = [...array];

    // Adaptive algorithm selection based on pattern analysis
    if (pattern.isNearlySorted && pattern.randomFactor < this.NEARLY_SORTED_THRESHOLD) {
      // Nearly sorted data: Use Insertion Sort (O(n) for nearly sorted)
      metrics.algorithmUsed = 'insertion';
      this.insertionSort(workingArray, compare, metrics);
    } else if (pattern.hasManyDuplicates) {
      // Many duplicates: Use 3-way Quicksort (handles duplicates efficiently)
      metrics.algorithmUsed = '3-way-quicksort';
      this.threeWayQuickSort(workingArray, 0, workingArray.length - 1, compare, metrics, 0, maxDepth);
    } else if (pattern.isReverseSorted) {
      // Reverse sorted: Use HeapSort to avoid QuickSort worst-case
      metrics.algorithmUsed = 'heapsort';
      this.heapSort(workingArray, compare, metrics);
    } else {
      // Random data: Use Introsort (QuickSort + fallbacks)
      metrics.algorithmUsed = 'introsort';
      this.introsort(workingArray, 0, workingArray.length - 1, compare, metrics, 0, maxDepth);
    }

    // Copy back to original array
    array.length = 0;
    array.push(...workingArray);

    metrics.executionTime = performance.now() - startTime;
    return metrics;
  }

  /**
   * Introsort: Hybrid of Quicksort, Heapsort, and Insertion Sort
   * Prevents worst-case O(n²) behavior by switching to HeapSort when recursion depth is exceeded
   */
  private static introsort<T>(
    arr: T[],
    left: number,
    right: number,
    compare: CompareFunction<T>,
    metrics: SortingMetrics,
    depth: number,
    maxDepth: number
  ): void {
    metrics.recursionDepth = Math.max(metrics.recursionDepth, depth);

    // Use insertion sort for small arrays (optimization: less overhead)
    const length = right - left + 1;
    if (length <= this.INSERTION_SORT_THRESHOLD) {
      this.insertionSortPartial(arr, left, right, compare, metrics);
      return;
    }

    // Switch to heapsort if recursion depth exceeded (prevents worst-case)
    if (depth > maxDepth) {
      this.heapSortPartial(arr, left, right, compare, metrics);
      return;
    }

    // Quicksort with median-of-three pivot selection
    const pivotIndex = this.medianOfThree(arr, left, right, compare, metrics);
    const partitionIndex = this.partition(arr, left, right, pivotIndex, compare, metrics);

    // Recursively sort smaller partition first (optimization: reduces stack depth)
    const leftSize = partitionIndex - left;
    const rightSize = right - partitionIndex;

    if (leftSize < rightSize) {
      this.introsort(arr, left, partitionIndex - 1, compare, metrics, depth + 1, maxDepth);
      this.introsort(arr, partitionIndex + 1, right, compare, metrics, depth + 1, maxDepth);
    } else {
      this.introsort(arr, partitionIndex + 1, right, compare, metrics, depth + 1, maxDepth);
      this.introsort(arr, left, partitionIndex - 1, compare, metrics, depth + 1, maxDepth);
    }
  }

  /**
   * Three-way Quicksort for arrays with many duplicates
   * Partitions into three regions: < pivot, = pivot, > pivot
   * Much more efficient than standard QuickSort when duplicates are common
   */
  private static threeWayQuickSort<T>(
    arr: T[],
    left: number,
    right: number,
    compare: CompareFunction<T>,
    metrics: SortingMetrics,
    depth: number,
    maxDepth: number
  ): void {
    if (left >= right) return;

    const length = right - left + 1;
    if (length <= this.INSERTION_SORT_THRESHOLD) {
      this.insertionSortPartial(arr, left, right, compare, metrics);
      return;
    }

    if (depth > maxDepth) {
      this.heapSortPartial(arr, left, right, compare, metrics);
      return;
    }

    // Three-way partition (Dutch National Flag algorithm)
    const pivot = arr[left];
    let lt = left; // arr[left..lt-1] < pivot
    let gt = right; // arr[gt+1..right] > pivot
    let i = left; // arr[lt..i-1] == pivot

    while (i <= gt) {
      metrics.comparisons++;
      const cmp = compare(arr[i], pivot);

      if (cmp < 0) {
        this.swap(arr, lt, i, metrics);
        lt++;
        i++;
      } else if (cmp > 0) {
        this.swap(arr, i, gt, metrics);
        gt--;
      } else {
        i++; // Equal to pivot
      }
    }

    // Recursively sort the less-than and greater-than partitions
    this.threeWayQuickSort(arr, left, lt - 1, compare, metrics, depth + 1, maxDepth);
    this.threeWayQuickSort(arr, gt + 1, right, compare, metrics, depth + 1, maxDepth);
  }

  /**
   * Insertion Sort - optimal for small or nearly-sorted arrays
   * Time Complexity: O(n) for nearly sorted, O(n²) worst case
   * Space Complexity: O(1)
   */
  private static insertionSort<T>(
    arr: T[],
    compare: CompareFunction<T>,
    metrics: SortingMetrics
  ): void {
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;

      // Shift elements greater than key to the right
      while (j >= 0) {
        metrics.comparisons++;
        if (compare(arr[j], key) <= 0) break;

        arr[j + 1] = arr[j];
        metrics.swaps++;
        j--;
      }
      arr[j + 1] = key;
    }
  }

  /**
   * Insertion Sort for partial array segment
   */
  private static insertionSortPartial<T>(
    arr: T[],
    left: number,
    right: number,
    compare: CompareFunction<T>,
    metrics: SortingMetrics
  ): void {
    for (let i = left + 1; i <= right; i++) {
      const key = arr[i];
      let j = i - 1;

      while (j >= left) {
        metrics.comparisons++;
        if (compare(arr[j], key) <= 0) break;

        arr[j + 1] = arr[j];
        metrics.swaps++;
        j--;
      }
      arr[j + 1] = key;
    }
  }

  /**
   * Heap Sort - fallback algorithm with guaranteed O(n log n) performance
   * Used when recursion depth is exceeded or for reverse-sorted data
   */
  private static heapSort<T>(
    arr: T[],
    compare: CompareFunction<T>,
    metrics: SortingMetrics
  ): void {
    this.heapSortPartial(arr, 0, arr.length - 1, compare, metrics);
  }

  /**
   * Heap Sort for partial array segment
   */
  private static heapSortPartial<T>(
    arr: T[],
    left: number,
    right: number,
    compare: CompareFunction<T>,
    metrics: SortingMetrics
  ): void {
    const length = right - left + 1;
    const heap = arr.slice(left, right + 1);

    // Build max heap
    for (let i = Math.floor(length / 2) - 1; i >= 0; i--) {
      this.heapify(heap, length, i, compare, metrics);
    }

    // Extract elements from heap one by one
    for (let i = length - 1; i > 0; i--) {
      this.swap(heap, 0, i, metrics);
      this.heapify(heap, i, 0, compare, metrics);
    }

    // Copy back to original array segment
    for (let i = 0; i < length; i++) {
      arr[left + i] = heap[i];
    }
  }

  /**
   * Helper function to maintain heap property
   */
  private static heapify<T>(
    arr: T[],
    n: number,
    i: number,
    compare: CompareFunction<T>,
    metrics: SortingMetrics
  ): void {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    // Compare with left child
    if (left < n) {
      metrics.comparisons++;
      if (compare(arr[left], arr[largest]) > 0) {
        largest = left;
      }
    }

    // Compare with right child
    if (right < n) {
      metrics.comparisons++;
      if (compare(arr[right], arr[largest]) > 0) {
        largest = right;
      }
    }

    // If largest is not root, swap and continue heapifying
    if (largest !== i) {
      this.swap(arr, i, largest, metrics);
      this.heapify(arr, n, largest, compare, metrics);
    }
  }

  /**
   * Lomuto partition function for Quicksort
   */
  private static partition<T>(
    arr: T[],
    left: number,
    right: number,
    pivotIndex: number,
    compare: CompareFunction<T>,
    metrics: SortingMetrics
  ): number {
    const pivot = arr[pivotIndex];
    this.swap(arr, pivotIndex, right, metrics);

    let i = left;
    for (let j = left; j < right; j++) {
      metrics.comparisons++;
      if (compare(arr[j], pivot) <= 0) {
        this.swap(arr, i, j, metrics);
        i++;
      }
    }

    this.swap(arr, i, right, metrics);
    return i;
  }

  /**
   * Median-of-three pivot selection
   * Reduces probability of worst-case O(n²) performance
   */
  private static medianOfThree<T>(
    arr: T[],
    left: number,
    right: number,
    compare: CompareFunction<T>,
    metrics: SortingMetrics
  ): number {
    const mid = Math.floor((left + right) / 2);

    // Sort left, mid, right to find median
    if (compare(arr[left], arr[mid]) > 0) {
      this.swap(arr, left, mid, metrics);
    }
    if (compare(arr[left], arr[right]) > 0) {
      this.swap(arr, left, right, metrics);
    }
    if (compare(arr[mid], arr[right]) > 0) {
      this.swap(arr, mid, right, metrics);
    }

    return mid; // arr[mid] is now the median
  }

  /**
   * Analyze data patterns to inform algorithm selection
   * This is the core of the adaptive approach
   */
  private static analyzePattern<T>(arr: T[], compare: CompareFunction<T>): DataPattern {
    const n = arr.length;
    if (n <= 1) {
      return {
        isNearlySorted: true,
        hasManyDuplicates: false,
        isReverseSorted: false,
        randomFactor: 0,
        duplicateRatio: 0
      };
    }

    let inversions = 0;
    let duplicateCount = 0;
    let reverseSorted = true;

    // Sample up to PATTERN_SAMPLE_SIZE elements for efficient analysis
    const sampleSize = Math.min(n, this.PATTERN_SAMPLE_SIZE);
    const step = n / sampleSize;

    // Analyze patterns through sampling
    for (let i = 0; i < sampleSize - 1; i++) {
      const idx1 = Math.floor(i * step);
      const idx2 = Math.floor((i + 1) * step);

      const cmp = compare(arr[idx1], arr[idx2]);

      if (cmp > 0) {
        inversions++;
        reverseSorted = false;
      }

      if (cmp === 0) {
        duplicateCount++;
      }
    }

    // Additional duplicate analysis with a different sample
    const sampleSet = new Set();
    const duplicateSampleSize = Math.min(n, 20);
    for (let i = 0; i < duplicateSampleSize; i++) {
      sampleSet.add(arr[i]);
    }

    const randomFactor = inversions / (sampleSize - 1);
    const duplicateRatio = 1 - (sampleSet.size / duplicateSampleSize);

    return {
      isNearlySorted: randomFactor < this.NEARLY_SORTED_THRESHOLD,
      hasManyDuplicates: duplicateRatio > this.DUPLICATE_THRESHOLD,
      isReverseSorted: reverseSorted,
      randomFactor,
      duplicateRatio
    };
  }

  /**
   * Swap two elements and track the operation
   */
  private static swap<T>(arr: T[], i: number, j: number, metrics: SortingMetrics): void {
    if (i !== j) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      metrics.swaps++;
    }
  }

  /**
   * Default comparison function for primitive types
   */
  private static defaultCompare<T>(a: T, b: T): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  /**
   * Validate that array is properly sorted
   */
  static validateSorted<T>(arr: T[], compareFn?: CompareFunction<T>): boolean {
    const compare = compareFn || this.defaultCompare;
    for (let i = 0; i < arr.length - 1; i++) {
      if (compare(arr[i], arr[i + 1]) > 0) {
        return false;
      }
    }
    return true;
  }
}

// Benchmarking and Testing Infrastructure
export class SortingBenchmark {
  /**
   * Generate test data with various patterns to test adaptability
   */
  static generateTestData(
    size: number,
    pattern: 'random' | 'sorted' | 'reverse' | 'nearly-sorted' | 'duplicates' | 'mixed'
  ): number[] {
    switch (pattern) {
      case 'sorted':
        return Array.from({ length: size }, (_, i) => i);

      case 'reverse':
        return Array.from({ length: size }, (_, i) => size - i);

      case 'nearly-sorted':
        const sorted = Array.from({ length: size }, (_, i) => i);
        // Create slight disorder by swapping 5% of elements
        const swapCount = Math.floor(size * 0.05);
        for (let i = 0; i < swapCount; i++) {
          const idx1 = Math.floor(Math.random() * size);
          const idx2 = Math.floor(Math.random() * size);
          [sorted[idx1], sorted[idx2]] = [sorted[idx2], sorted[idx1]];
        }
        return sorted;

      case 'duplicates':
        // Create array with many duplicate values (10% unique)
        const uniqueValues = Math.max(1, Math.floor(size * 0.1));
        return Array.from({ length: size }, () => Math.floor(Math.random() * uniqueValues));

      case 'mixed':
        // Combination of sorted sections and random data
        const quarter = Math.floor(size / 4);
        const sortedSection1 = Array.from({ length: quarter }, (_, i) => i);
        const randomSection = Array.from({ length: quarter * 2 }, () => Math.floor(Math.random() * size));
        const sortedSection2 = Array.from({ length: quarter }, (_, i) => size - quarter + i);
        return [...sortedSection1, ...randomSection, ...sortedSection2];

      case 'random':
      default:
        return Array.from({ length: size }, () => Math.floor(Math.random() * size * 10));
    }
  }

  /**
   * Compare adaptive performance with native Array.sort()
   */
  static compareWithNative(size: number): void {
    const patterns = ['random', 'sorted', 'reverse', 'nearly-sorted', 'duplicates'] as const;

    console.log('=== Performance Comparison with Native Array.sort() ===');
    console.log(`Array Size: ${size.toLocaleString()}\n`);

    let totalAdaptiveTime = 0;
    let totalNativeTime = 0;

    for (const pattern of patterns) {
      const data = this.generateTestData(size, pattern);

      // Test adaptive sort
      const adaptiveData = [...data];
      const adaptiveStart = performance.now();
      const adaptiveMetrics = AdaptiveSorter.adaptiveSort(adaptiveData);
      const adaptiveTime = performance.now() - adaptiveStart;

      // Test native sort
      const nativeData = [...data];
      const nativeStart = performance.now();
      nativeData.sort((a, b) => a - b);
      const nativeTime = performance.now() - nativeStart;

      totalAdaptiveTime += adaptiveTime;
      totalNativeTime += nativeTime;

      const speedup = nativeTime / adaptiveTime;

      console.log(`${pattern.padEnd(15)}:`);
      console.log(`  Adaptive: ${adaptiveTime.toFixed(2)}ms (${adaptiveMetrics.algorithmUsed})`);
      console.log(`  Native:   ${nativeTime.toFixed(2)}ms`);
      console.log(`  Speedup:  ${speedup.toFixed(2)}x ${speedup > 1.1 ? '↑' : speedup < 0.9 ? '↓' : '≈'}`);
      console.log();
    }

    console.log(`Overall Performance:`);
    console.log(`  Adaptive Total: ${totalAdaptiveTime.toFixed(2)}ms`);
    console.log(`  Native Total:   ${totalNativeTime.toFixed(2)}ms`);
    console.log(`  Average Speedup: ${(totalNativeTime / totalAdaptiveTime).toFixed(2)}x`);
  }
}

// Usage Examples and Edge Case Handling
export class SortingExamples {
  /**
   * Demonstrate robustness with comprehensive edge cases
   */
  static testEdgeCases(): void {
    console.log('=== Edge Case and Robustness Testing ===\n');

    const edgeCases = [
      { name: 'Empty array', data: [] },
      { name: 'Single element', data: [1] },
      { name: 'All duplicates', data: [5, 5, 5, 5, 5] },
      { name: 'Alternating pattern', data: [1, 2, 1, 2, 1, 2, 1, 2] },
      { name: 'Single large number', data: [100] },
      { name: 'Large duplicate array', data: Array.from({ length: 1000 }, () => 42) },
      { name: 'Reverse sorted large', data: Array.from({ length: 100 }, (_, i) => 100 - i) },
      { name: 'Already sorted', data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      { name: 'Two elements', data: [2, 1] },
      { name: 'Mixed types (numbers)', data: [-1, 0, 1, -2, 2, -3, 3] }
    ];

    edgeCases.forEach((testCase, index) => {
      const testCopy = [...testCase.data];
      const metrics = AdaptiveSorter.adaptiveSort(testCopy);
      const isValid = AdaptiveSorter.validateSorted(testCopy);

      console.log(`Test ${index + 1}: ${testCase.name}`);
      console.log(`  Input:    [${testCase.data.slice(0, 10).join(', ')}${testCase.data.length > 10 ? '...' : ''}]`);
      console.log(`  Algorithm: ${metrics.algorithmUsed}`);
      console.log(`  Time:     ${metrics.executionTime.toFixed(4)}ms`);
      console.log(`  Valid:    ${isValid ? '✓' : '✗'}`);
      if (metrics.patternAnalysis) {
        console.log(`  Pattern:  ${JSON.stringify(metrics.patternAnalysis)}`);
      }
      console.log();
    });
  }
}

// Convenience exports for direct usage
export function adaptiveSort<T>(array: T[], compareFn?: CompareFunction<T>): SortingMetrics {
  return AdaptiveSorter.adaptiveSort(array, compareFn);
}

// Export for immediate usage
export default {
  AdaptiveSorter,
  SortingBenchmark,
  SortingExamples,
  adaptiveSort
};