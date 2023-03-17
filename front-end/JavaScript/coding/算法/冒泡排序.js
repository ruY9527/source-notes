const arr=[2,13,4,5,6,33,67,1,23,5,99]
const bubbleSort=(arr)=>{
    for(let i=0;i<arr.length;i++){
        for(let j=i+1;j<arr.length;j++){
            temp=arr[i]
            if(arr[i]>arr[j]){
                arr[i]=arr[j]
                arr[j]=temp
            }
        }
    }
    return arr
}
console.log(bubbleSort(arr))