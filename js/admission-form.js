const form = document.getElementById("admission-form");
const submitBtn = document.getElementById("submit-btn");
const formPage = document.getElementById("form-page");
const successScreen = document.getElementById("success-screen");

var uploadedFile = null;

var fields = [
  "childFullName",
  "gender",
  "dateOfBirth",
];

// ====== FILE UPLOAD ======
var uploadArea = document.getElementById("upload-area");
var fileInput = document.getElementById("birthCertificate");
var uploadContent = document.getElementById("upload-content");
var uploadPreview = document.getElementById("upload-preview");
var uploadFileName = document.getElementById("upload-file-name");
var uploadFileSize = document.getElementById("upload-file-size");
var uploadRemove = document.getElementById("upload-remove");

uploadArea.addEventListener("click", function () {
  fileInput.click();
});

uploadArea.addEventListener("dragover", function (e) {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", function () {
  uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", function (e) {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener("change", function () {
  if (fileInput.files.length > 0) {
    handleFile(fileInput.files[0]);
  }
});

uploadRemove.addEventListener("click", function (e) {
  e.stopPropagation();
  removeFile();
});

function handleFile(file) {
  var validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  if (validTypes.indexOf(file.type) === -1) {
    showError("birthCertificate", "Only PDF, JPG, JPEG, and PNG files are accepted");
    return;
  }
  if (file.size > 100 * 1024 * 1024) {
    showError("birthCertificate", "File size must be less than 100 MB");
    return;
  }

  clearErrors();
  uploadedFile = file;
  uploadFileName.textContent = file.name;
  uploadFileSize.textContent = formatFileSize(file.size);
  uploadContent.style.display = "none";
  uploadPreview.style.display = "flex";
}

function removeFile() {
  uploadedFile = null;
  fileInput.value = "";
  uploadContent.style.display = "block";
  uploadPreview.style.display = "none";
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function fileToBase64(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function () {
      resolve(reader.result);
    };
    reader.onerror = function (error) {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

// ====== FORM LOGIC ======
function getFormData() {
  var data = {};
  var inputs = form.querySelectorAll("input, select");
  inputs.forEach(function (input) {
    if (input.name && input.type !== "file") {
      data[input.name] = input.value.trim();
    }
  });
  return data;
}

function validateAge(dateString) {
  var birth = new Date(dateString);
  var today = new Date();
  var age = today.getFullYear() - birth.getFullYear();
  var m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 3;
}

function showError(name, message) {
  var input = document.getElementById(name);
  var err = document.getElementById("err-" + name);
  if (input) input.classList.add("error");
  if (err) err.textContent = message;
}

function clearErrors() {
  document.querySelectorAll(".error-msg").forEach(function (el) {
    el.textContent = "";
  });
  document.querySelectorAll(".error").forEach(function (el) {
    el.classList.remove("error");
  });
}

function validate() {
  clearErrors();
  var valid = true;
  var data = getFormData();

  if (!data.childFullName) {
    showError("childFullName", "Child's full name is required");
    valid = false;
  }
  if (!data.gender) {
    showError("gender", "Gender is required");
    valid = false;
  }
  if (!data.dateOfBirth) {
    showError("dateOfBirth", "Date of birth is required");
    valid = false;
  } else if (!validateAge(data.dateOfBirth)) {
    showError("dateOfBirth", "Child must be at least 3 years old");
    valid = false;
  }
  if (!uploadedFile) {
    showError("birthCertificate", "Birth certificate is required");
    valid = false;
  }

  return valid;
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!validate()) return;

  var data = getFormData();
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> Submitting...';

  try {
    var birthCertBase64 = null;
    if (uploadedFile) {
      birthCertBase64 = await fileToBase64(uploadedFile);
    }

    var localAppNumber = "NCA-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 9000) + 1000);
    var localData = {
      id: "local_" + Date.now(),
      app_number: localAppNumber,
      child_full_name: data.childFullName,
      gender: data.gender,
      date_of_birth: data.dateOfBirth,
      applying_class: data.applyingClass || "Nursery One (Baby Class)",
      father_full_name: data.fatherFullName || null,
      father_national_id: data.fatherNationalId || null,
      father_phone: data.fatherPhone || null,
      mother_full_name: data.motherFullName || null,
      mother_national_id: data.motherNationalId || null,
      mother_phone: data.motherPhone || null,
      province: data.province || null,
      district: data.district || null,
      sector: data.sector || null,
      cell: data.cell || null,
      village: data.village || null,
      birth_certificate_name: uploadedFile ? uploadedFile.name : null,
      birth_certificate_data: birthCertBase64,
      status: "Pending",
      created_at: new Date().toISOString()
    };
    try {
      localStorage.setItem("nca_admission_" + Date.now(), JSON.stringify(localData));
    } catch (e) {
      console.warn("LocalStorage backup warning:", e);
    }

    if (supabase && typeof supabase.from === "function") {
      var insertData = {
        child_full_name: data.childFullName,
        gender: data.gender,
        date_of_birth: data.dateOfBirth,
        applying_class: data.applyingClass || "Nursery One (Baby Class)",
        father_full_name: data.fatherFullName || null,
        father_national_id: data.fatherNationalId || null,
        father_phone: data.fatherPhone || null,
        mother_full_name: data.motherFullName || null,
        mother_national_id: data.motherNationalId || null,
        mother_phone: data.motherPhone || null,
        province: data.province || null,
        district: data.district || null,
        sector: data.sector || null,
        cell: data.cell || null,
        village: data.village || null,
        birth_certificate_name: uploadedFile ? uploadedFile.name : null,
        birth_certificate_data: birthCertBase64,
        status: "Pending",
      };

      var result = await supabase.from("admissions").insert([insertData]);
      if (result.error) {
        throw result.error;
      }
    }

    formPage.style.display = "none";
    successScreen.style.display = "flex";
  } catch (err) {
    alert("Error submitting application: " + (err.message || err));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Application";
  }
});

function clearForm() {
  form.reset();
  clearErrors();
  removeFile();
}

function resetForm() {
  form.reset();
  clearErrors();
  removeFile();
  successScreen.style.display = "none";
  formPage.style.display = "block";
  window.scrollTo(0, 0);
}
