// Farm regions (Egyptian Delta) and region name aliases.

const farmRegions = [
  { code: "EG-GH", name: "الغربية — طنطا (وسط الدلتا)", latitude: 30.7865, longitude: 31.0004 },
  { code: "EG-DK", name: "الدقهلية — المنصورة", latitude: 31.0364, longitude: 31.3807 },
  { code: "EG-BH", name: "البحيرة — دمنهور", latitude: 31.0341, longitude: 30.4682 },
  { code: "EG-KFS", name: "كفر الشيخ", latitude: 31.1107, longitude: 30.9399 },
  { code: "EG-MNF", name: "المنوفية — شبين الكوم", latitude: 30.5526, longitude: 31.0105 },
  { code: "EG-KB", name: "القليوبية — بنها", latitude: 30.4667, longitude: 31.1833 },
  { code: "EG-SHR", name: "الشرقية — الزقازيق", latitude: 30.5877, longitude: 31.5020 },
  { code: "EG-DT", name: "دمياط", latitude: 31.4175, longitude: 31.8144 },
];
const farmRegionAliases = [
  { code: "EG-GH", names: ["Gharbia", "Gharbeya", "Tanta", "الغربية", "طنطا"] },
  { code: "EG-DK", names: ["Dakahlia", "Daqahlia", "Mansoura", "الدقهلية", "المنصورة"] },
  { code: "EG-BH", names: ["Beheira", "Behira", "Damanhur", "البحيرة", "دمنهور"] },
  { code: "EG-KFS", names: ["Kafr El Sheikh", "Kafr El-Sheikh", "كفر الشيخ"] },
  { code: "EG-MNF", names: ["Monufia", "Menoufia", "Ashmoun", "Shebin El Kom", "Shibin El Kom", "المنوفية", "أشمون", "اشمون", "شبين الكوم"] },
  { code: "EG-KB", names: ["Qalyubia", "Benha", "القليوبية", "بنها"] },
  { code: "EG-SHR", names: ["Sharqia", "Zagazig", "الشرقية", "الزقازيق"] },
  { code: "EG-DT", names: ["Damietta", "دمياط"] },
];
const defaultFarmRegion = farmRegions[0];
const defaultWeatherLocation = "Ashmoun, Menofia, EG";
const regionSettingsKey = "fieldwise-region-v1";
