import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyAbDNHc72qZ4mSOZYOP5Yfe56qF8RAzNtU",
    authDomain: "testing-firebase-ed8b9.firebaseapp.com",
    projectId: "testing-firebase-ed8b9",
    storageBucket: "testing-firebase-ed8b9.appspot.com",
    messagingSenderId: "204071893005",
    appId: "1:204071893005:web:ee3ec992f5dc603cb4fd44",
    measurementId: "G-K4B4KCL6HZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentPersonId = null;
let html5QrcodeScanner = null;

async function getPerson(qrCodeId) {
    try {
        const docRef = doc(db, 'people', qrCodeId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            throw new Error("Documento não encontrado.");
        }
    } catch (error) {
        console.error('Erro ao buscar pessoa:', error);
        throw error;
    }
}

async function updateCheckIn(qrCodeId) {
    try {
        const docRef = doc(db, 'people', qrCodeId);
        await updateDoc(docRef, { StatusPresenca: true });        
        return true;
    } catch (error) {
        console.error('Erro ao atualizar check-in:', error);
        return false;
    }
}

async function loadCheckedInPeople() {
    const querySnapshot = await getDocs(collection(db, 'people'));
    const tableBody = document.querySelector('#checkedInTable tbody');
    tableBody.innerHTML = ''; 

    const students = [];

    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.StatusPresenca) {
            students.push({ id: doc.id, ...data });
        }
    });

    students.sort((a, b) => a.Nome.localeCompare(b.Nome));

    students.forEach(student => {
        addCheckedInPerson(student.Nome, student.Curso, student.Periodo, student.id);
    });
}
function addCheckedInPerson(nome, curso, periodo, id) {
    const tableBody = document.querySelector('#checkedInTable tbody');
    
    const existingRows = Array.from(tableBody.children);
    const rowExists = existingRows.some(row => row.dataset.id === id);
    
    if (!rowExists) {
        const row = document.createElement('tr');
        row.dataset.id = id; 
        
        const nameCell = document.createElement('td');
        nameCell.textContent = nome;
        nameCell.style.border = '1px solid #ddd';
        nameCell.style.padding = '8px';
        
        const courseCell = document.createElement('td');
        courseCell.textContent = curso;
        courseCell.style.border = '1px solid #ddd';
        courseCell.style.padding = '8px';

        const periodCell = document.createElement('td');
        periodCell.textContent = periodo;
        periodCell.style.border = '1px solid #ddd';
        periodCell.style.padding = '8px';
        
        row.appendChild(nameCell);
        row.appendChild(courseCell);
        row.appendChild(periodCell);
        tableBody.appendChild(row);
    }
}


async function handleQrCodeScan(qrCodeMessage) {
    try {
        const student = await getPerson(qrCodeMessage);
        currentPersonId = qrCodeMessage;

        if (student.StatusPresenca) {
            showSuccessMessage(`${student.Nome} já registrou presença!`);
            stopScanning();
        } else {
            document.getElementById('personName').textContent = `Nome: ${student.Nome}`;
            document.getElementById('personCourse').textContent = `Curso: ${student.Curso}`;
            document.getElementById('personPeriod').textContent = `Período: ${student.Periodo}`;
            document.getElementById('checkInStatus').textContent = 'Status: Aguardando registro de presença';
            document.getElementById('checkInButton').disabled = false;
            document.getElementById('personInfo').style.display = 'block';
            stopScanning();
        }
    } catch (error) {
        showError('Erro ao processar QR Code: ' + error.message);
    }
}

async function handleCheckIn() {
    if (!currentPersonId) return;

    try {
        const success = await updateCheckIn(currentPersonId);
        if (success) {
            const person = await getPerson(currentPersonId);
            resetToScanning();
            addCheckedInPerson(person.Nome, person.Curso, person.Periodo, currentPersonId); // Atualizado para usar Curso e Periodo
            showSuccessMessage('Check-in efetuado com sucesso!');
        } else {
            showError('Erro ao realizar check-in');
        }
    } catch (error) {
        showError('Erro durante a operação de check-in: ' + error.message);
    }
}

function startScanning() {
    document.getElementById('startButton').style.display = 'none';
    document.getElementById('qrReader').style.display = 'block';
    document.getElementById('cancelButton').style.display = 'block';

    html5QrcodeScanner = new Html5QrcodeScanner(
        "qrReader", 
        { 
            fps: 10,
            qrbox: { width: 250, height: 250 }
        }
    );

    html5QrcodeScanner.render(handleQrCodeScan);
}

function stopScanning() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
    }
    document.getElementById('qrReader').style.display = 'none';
    document.getElementById('cancelButton').style.display = 'none';
    document.getElementById('startButton').style.display = 'flex';
}

// function returnToScanningAfterDelay() {
//   setTimeout(() => {
//       resetToScanning();
//   }, 3000); // Aguarda 3 segundos antes de retornar ao scanner
// }


function resetToScanning() {
    document.getElementById('personInfo').style.display = 'none';
    stopScanning();
}

function showSuccessMessage(message) {
    const successElement = document.getElementById('successMessage');
    successElement.textContent = message;
    successElement.style.display = 'block';
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 1000);
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => errorElement.style.display = 'none', 2000);
}

document.getElementById('startButton').addEventListener('click', startScanning);
document.getElementById('cancelButton').addEventListener('click', stopScanning);
document.getElementById('checkInButton').addEventListener('click', handleCheckIn);

// Carrega os dados ao iniciar
document.addEventListener('DOMContentLoaded', loadCheckedInPeople);
