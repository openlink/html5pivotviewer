#!/bin/bash
imageid=$1
top_folder=$imageid"_files"

echo $top_folder
mkdir $top_folder
cd $top_folder
mkdir 0
mkdir 1
mkdir 2
mkdir 3
mkdir 4
mkdir 5
mkdir 6
mkdir 7
mkdir 8
mkdir 9
cd 0
curl -O http://localhost:8892/DeepZoomCache/$top_folder/0/0_0.jpg
cd ../1
curl -O http://localhost:8892/DeepZoomCache/$top_folder/1/0_0.jpg
cd ../2
curl -O http://localhost:8892/DeepZoomCache/$top_folder/2/0_0.jpg
cd ../3
curl -O http://localhost:8892/DeepZoomCache/$top_folder/3/0_0.jpg
cd ../4
curl -O http://localhost:8892/DeepZoomCache/$top_folder/4/0_0.jpg
cd ../5
curl -O http://localhost:8892/DeepZoomCache/$top_folder/5/0_0.jpg
cd ../6
curl -O http://localhost:8892/DeepZoomCache/$top_folder/6/0_0.jpg
cd ../7
curl -O http://localhost:8892/DeepZoomCache/$top_folder/7/0_0.jpg
cd ../8
curl -O http://localhost:8892/DeepZoomCache/$top_folder/8/0_0.jpg
cd ../9
curl -O http://localhost:8892/DeepZoomCache/$top_folder/9/0_0.jpg
curl -O http://localhost:8892/DeepZoomCache/$top_folder/9/1_0.jpg
curl -O http://localhost:8892/DeepZoomCache/$top_folder/9/0_1.jpg
curl -O http://localhost:8892/DeepZoomCache/$top_folder/9/1_1.jpg

cd ../..
echo done
