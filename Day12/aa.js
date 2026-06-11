document.getElementById('bb').style.color="red";

// 버튼 요소 찾아서 클릭 이벤트 등록
var btn= document.querySelector('#btn'); //css 선택자 요소 찾기
btn.onclick= function(){ //html에는 onclick 없지만, JS에서 속성에 함수를 대입 -- PDF 제12장 31p
    alert('클릭됨! 이벤트가 발생~')
}

// 또 다른 동작으로 이벤트 등록하면..??? 이전 이벤트 함수는 없어지고, 이 함수만 실행됨. (여러개 X)
btn.onclick= function(){
    alert('이전 이벤트 함수는 없어짐!')
}

// -----------------------------------------------

// 버튼 클릭 이벤트 처리 또 다른 방법
var btn2= document.querySelector('.kk');
btn2.addEventListener('click', function(){ //클릭 되었을 때! 함수 실행!
    alert('버튼 눌렀어요!')
});

btn2.addEventListener('click', function(){
    alert('두번째 이벤트 처리 함수')
});
// 여러개를 등록하면 차례대로 실행됨
// (위 방법은 하나만 사용가능해서... 기능 구현이 제한적... 그래서 이 방법을 더 선호!)