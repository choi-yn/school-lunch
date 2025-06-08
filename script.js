let selectedSchool = null;

// 오늘 날짜를 기본값으로 설정
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('mealDate').value = `${year}-${month}-${day}`;
});

// 요일 구하기 함수
function getDayOfWeek(date) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
}

// 학교 검색 함수
async function searchSchool() {
    const schoolName = document.getElementById('schoolName').value;
    if (!schoolName) {
        Swal.fire({
            title: '알림',
            text: '학교명을 입력해주세요!',
            icon: 'info',
            confirmButtonText: '확인',
            confirmButtonColor: '#f9a8d4'
        });
        return;
    }

    try {
        const response = await fetch(`https://open.neis.go.kr/hub/schoolInfo?SCHUL_NM=${encodeURIComponent(schoolName)}`);
        const text = await response.text();
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        
        const schoolList = document.getElementById('schoolList');
        schoolList.innerHTML = '';

        const rows = xmlDoc.getElementsByTagName("row");
        if (rows.length === 0) {
            Swal.fire({
                title: '알림',
                text: '검색 결과가 없습니다.',
                icon: 'warning',
                confirmButtonText: '확인',
                confirmButtonColor: '#f9a8d4'
            });
            return;
        }

        for (let i = 0; i < rows.length; i++) {
            const school = rows[i];
            const schoolName = school.getElementsByTagName("SCHUL_NM")[0].textContent;
            const schoolCode = school.getElementsByTagName("SD_SCHUL_CODE")[0].textContent;
            const officeCode = school.getElementsByTagName("ATPT_OFCDC_SC_CODE")[0].textContent;
            const schoolAddr = school.getElementsByTagName("ORG_RDNMA")[0].textContent;
            
            const div = document.createElement('div');
            div.className = 'school-item';
            div.textContent = `${schoolName} (${schoolAddr})`;
            div.onclick = () => selectSchool(officeCode, schoolCode, schoolName);
            schoolList.appendChild(div);
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: '오류',
            text: '학교 검색 중 오류가 발생했습니다.',
            icon: 'error',
            confirmButtonText: '확인',
            confirmButtonColor: '#f9a8d4'
        });
    }
}

// 학교 선택 함수
function selectSchool(officeCode, schoolCode, schoolName) {
    selectedSchool = {
        officeCode: officeCode,
        code: schoolCode,
        name: schoolName
    };
    document.getElementById('schoolName').value = schoolName;
    document.getElementById('schoolList').innerHTML = '';
    getMealInfo();
}

// 급식 정보 조회 함수
async function getMealInfo() {
    if (!selectedSchool) {
        Swal.fire({
            title: '알림',
            text: '학교를 먼저 선택해주세요!',
            icon: 'info',
            confirmButtonText: '확인',
            confirmButtonColor: '#f9a8d4'
        });
        return;
    }

    const dateInput = document.getElementById('mealDate').value;
    const date = dateInput.replace(/-/g, '');
    const selectedDate = new Date(dateInput);
    
    try {
        const response = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=${selectedSchool.officeCode}&SD_SCHUL_CODE=${selectedSchool.code}&MLSV_YMD=${date}`);
        const text = await response.text();
        
        const selectedDateElement = document.getElementById('selectedDate');
        const mealContent = document.getElementById('mealContent');
        
        // 날짜 표시 형식 변경 (YYYY-MM-DD -> YYYY년 MM월 DD일 (요일))
        const formattedDate = `${dateInput.substring(0, 4)}년 ${dateInput.substring(5, 7)}월 ${dateInput.substring(8, 10)}일 (${getDayOfWeek(selectedDate)})`;
        selectedDateElement.textContent = `${selectedSchool.name} - ${formattedDate}`;

        // XML 파싱
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        
        // 에러 체크
        const error = xmlDoc.getElementsByTagName("ERROR");
        if (error.length > 0) {
            mealContent.textContent = '해당 날짜의 급식 정보가 없습니다.';
            return;
        }

        // 급식 정보 추출
        const row = xmlDoc.getElementsByTagName("row");
        if (row.length > 0) {
            const mealInfo = row[0];
            const menu = mealInfo.getElementsByTagName("DDISH_NM")[0].textContent;
            // <br/> 태그를 줄바꿈으로 변환하고, 각 메뉴를 줄바꿈으로 구분
            const formattedMenu = menu
                .replace(/<br\/>/g, '\n')  // <br/> 태그를 줄바꿈으로 변환
                .split('\n')               // 줄바꿈으로 분리
                .filter(item => item.trim()) // 빈 줄 제거
                .join('\n');               // 다시 줄바꿈으로 연결
            mealContent.textContent = formattedMenu;
        } else {
            mealContent.textContent = '급식 정보를 불러오는데 실패했습니다.';
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: '오류',
            text: '급식 정보를 불러오는데 실패했습니다.',
            icon: 'error',
            confirmButtonText: '확인',
            confirmButtonColor: '#f9a8d4'
        });
    }
}
