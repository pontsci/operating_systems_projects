for ($firstNum = 5 ; $firstNum -le 50 ; $firstNum+=5){    
  for ($secondNum = 5 ; $secondNum -le 50 ; $secondNum+=5){    
    for ($thirdNum = 5 ; $thirdNum -le 50 ; $thirdNum+=5){    
      for ($fourthNum = 5 ; $fourthNum -le 50 ; $fourthNum+=5){
        if($firstNum + $secondNum + $thirdNum + $fourthNum -eq 50){   
          node .\prog4.js V2-Official-Test-data.txt $firstNum $secondNum $thirdNum $fourthNum;
        }
      }
    }
  }
}