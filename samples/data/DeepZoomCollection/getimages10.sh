#!/bin/bash
imageid=$1
top_folder=$imageid"_files"

echo $top_folder
cd $top_folder
mkdir 10
cd 10
curl -O http://localhost:8892/DeepZoomCache/$top_folder/10/0_0.jpg
curl -O http://localhost:8892/DeepZoomCache/$top_folder/10/1_0.jpg
curl -O http://localhost:8892/DeepZoomCache/$top_folder/10/0_1.jpg
curl -O http://localhost:8892/DeepZoomCache/$top_folder/10/1_1.jpg
curl -O http://localhost:8892/DeepZoomCache/$top_folder/10/2_1.jpg
curl -O http://localhost:8892/DeepZoomCache/$top_folder/10/1_2.jpg
curl -O http://localhost:8892/DeepZoomCache/$top_folder/10/2_0.jpg
curl -O http://localhost:8892/DeepZoomCache/$top_folder/10/0_2.jpg
curl -O http://localhost:8892/DeepZoomCache/$top_folder/10/2_2.jpg
curl -O http://localhost:8892/DeepZoomCache/$top_folder/10/3_0.jpg
curl -O http://localhost:8892/DeepZoomCache/$top_folder/10/3_1.jpg
curl -O http://localhost:8892/DeepZoomCache/$top_folder/10/3_2.jpg

cd ../..
echo done
