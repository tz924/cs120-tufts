# Lab 8 The Ride-Hailing Service Part 1

1. Identify what aspects of the work have been correctly implemented and what have not.

   Implemented all required features.

2. Identify anyone with whom you have collaborated or discussed the lab.

   None.

3. Show the impact of performance enhancements.

   Very interestingly, the number of requests and file sizes are dependent on
   the window size. To have a controlled environment, I have fixed the window size
   at 1920 x 1080, the most common screen size for desktops, and disabled caches.

   In summary, we don't have a lot of file size reduction from minimization as the code base was small originally. See details below.

   However, the experiments did show consistent savings in final load time:
   827.9 ms (before) VS 763.4 ms (after). For more details show the data table below.

   ## Before Optimization

   | Filename  | Size   |
   | --------- | ------ |
   | style.css | 457 B  |
   | index.js  | 1.5 kB |

   | Experiment | # Requests | File Sizes (MB) | Resources (MB) | Finish Load Time (ms) | DOMContentLoaded (ms) | Load (ms) |
   | ---------- | ---------- | --------------- | -------------- | --------------------- | --------------------- | --------- |
   | 1          | 92         | 2.20            | 2.90           | 833.00                | 35.00                 | 234.00    |
   | 2          | 92         | 2.20            | 2.90           | 976.00                | 51.00                 | 263.00    |
   | 3          | 92         | 2.20            | 2.90           | 822.00                | 51.00                 | 240.00    |
   | 4          | 92         | 2.20            | 2.90           | 820.00                | 45.00                 | 239.00    |
   | 5          | 92         | 2.20            | 2.90           | 802.00                | 49.00                 | 187.00    |
   | 6          | 92         | 2.20            | 2.90           | 793.00                | 66.00                 | 216.00    |
   | 7          | 92         | 2.20            | 2.90           | 852.00                | 70.00                 | 256.00    |
   | 8          | 92         | 2.20            | 2.90           | 730.00                | 45.00                 | 175.00    |
   | 9          | 92         | 2.20            | 2.90           | 833.00                | 56.00                 | 204.00    |
   | 10         | 92         | 2.20            | 2.90           | 818.00                | 38.00                 | 209.00    |
   | Average    | 92         | 2.20            | 2.90           | 827.90                | 50.60                 | 222.30    |

   ## After Optimization

   | Filename      | Size  |
   | ------------- | ----- |
   | style.min.css | 271b  |
   | index.min.js  | 1.1kb |

   | Experiment | # Requests | File Sizes (MB) | Resources (MB) | Finish Load Time (ms) | DOMContentLoaded (ms) | Load (ms) |
   | ---------- | ---------- | --------------- | -------------- | --------------------- | --------------------- | --------- |
   | 1          | 92         | 2.20            | 2.90           | 803.00                | 69.00                 | 199.00    |
   | 2          | 92         | 2.20            | 2.90           | 791.00                | 91.00                 | 234.00    |
   | 3          | 91         | 2.20            | 2.90           | 806.00                | 37.00                 | 478.00    |
   | 4          | 91         | 2.20            | 2.90           | 740.00                | 45.00                 | 460.00    |
   | 5          | 92         | 2.20            | 2.90           | 721.00                | 44.00                 | 161.00    |
   | 6          | 92         | 2.20            | 2.90           | 755.00                | 38.00                 | 181.00    |
   | 7          | 92         | 2.20            | 2.90           | 749.00                | 84.00                 | 182.00    |
   | 8          | 92         | 2.20            | 2.90           | 767.00                | 53.00                 | 192.00    |
   | 9          | 92         | 2.20            | 2.90           | 740.00                | 43.00                 | 167.00    |
   | 10         | 92         | 2.20            | 2.90           | 762.00                | 91.00                 | 167.00    |
   | Average    | 92         | 2.20            | 2.90           | 763.40                | 59.50                 | 242.10    |

4. Say approximately how many hours you have spent completing the lab.

   4 hours. 2 hours for data collection and cleaning.
