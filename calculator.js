(function initKurabeStockCalculator(globalObject) {
  "use strict";

  const MEALS_PER_PERSON_DAY = 3;
  const WATER_LITERS_PER_PERSON_DAY = 3;

  function assertFiniteNumber(value, label) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new TypeError(`${label}は数値で入力してください。`);
    return number;
  }

  function calculateStock({ people, days, currentMeals, currentWater }) {
    const normalizedPeople = assertFiniteNumber(people, "人数");
    const normalizedDays = assertFiniteNumber(days, "日数");
    const normalizedMeals = assertFiniteNumber(currentMeals, "食数");
    const normalizedWater = assertFiniteNumber(currentWater, "水量");

    if (!Number.isInteger(normalizedPeople) || normalizedPeople < 1 || normalizedPeople > 20) {
      throw new RangeError("人数は1〜20の整数で入力してください。");
    }
    if (!Number.isInteger(normalizedDays) || normalizedDays < 1 || normalizedDays > 14) {
      throw new RangeError("日数は1〜14の整数で入力してください。");
    }
    if (!Number.isInteger(normalizedMeals) || normalizedMeals < 0 || normalizedMeals > 999) {
      throw new RangeError("食数は0〜999の整数で入力してください。");
    }
    if (normalizedWater < 0 || normalizedWater > 999) {
      throw new RangeError("水量は0〜999Lで入力してください。");
    }

    const requiredMeals = normalizedPeople * normalizedDays * MEALS_PER_PERSON_DAY;
    const requiredWater = normalizedPeople * normalizedDays * WATER_LITERS_PER_PERSON_DAY;
    const shortMeals = Math.max(0, requiredMeals - normalizedMeals);
    const shortWater = Math.max(0, Math.round((requiredWater - normalizedWater) * 10) / 10);
    const bottles = Math.ceil(shortWater / 2);
    const mealDays = Math.round((normalizedMeals / (normalizedPeople * MEALS_PER_PERSON_DAY)) * 10) / 10;
    const waterDays = Math.round((normalizedWater / (normalizedPeople * WATER_LITERS_PER_PERSON_DAY)) * 10) / 10;

    return {
      people: normalizedPeople,
      days: normalizedDays,
      currentMeals: normalizedMeals,
      currentWater: Math.round(normalizedWater * 10) / 10,
      requiredMeals,
      requiredWater,
      shortMeals,
      shortWater,
      bottles,
      mealDays,
      waterDays,
    };
  }

  globalObject.KurabeStockCalculator = Object.freeze({ calculateStock });

  if (typeof document === "undefined") return;

  const form = document.querySelector("#stock-calculator-form");
  if (!form) return;

  const error = document.querySelector("#stock-error");
  const summary = document.querySelector("[data-summary]");
  const consultationLink = document.querySelector("#consultation-link");

  const format = (value) => new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 }).format(value);

  function render() {
    try {
      const selectedDays = form.querySelector('input[name="days"]:checked');
      const result = calculateStock({
        people: form.elements.people.value,
        days: selectedDays?.value,
        currentMeals: form.elements.currentMeals.value,
        currentWater: form.elements.currentWater.value,
      });

      for (const [key, value] of Object.entries(result)) {
        document.querySelectorAll(`[data-result="${key}"]`).forEach((node) => {
          node.textContent = format(value);
        });
      }

      const mealStatus = result.shortMeals > 0 ? `${format(result.shortMeals)}食不足` : "食数は目安を満たします";
      const waterStatus = result.shortWater > 0 ? `${format(result.shortWater)}L不足` : "水量は目安を満たします";
      summary.textContent = `${result.people}人・${result.days}日には${result.requiredMeals}食と${result.requiredWater}L。手持ちを引くと、${mealStatus}、${waterStatus}です。`;

      const subject = "KURABE 調査便｜備蓄計算から比較ミニ便の相談";
      const body = [
        "計算結果をもとに、非常食の候補比較を相談します。",
        "",
        `人数：${result.people}人`,
        `目標：${result.days}日`,
        `手持ち：${result.currentMeals}食・${format(result.currentWater)}L`,
        `不足目安：${result.shortMeals}食・${format(result.shortWater)}L`,
        "予算：",
        "アレルギー・外せない条件：",
        "",
        "これは相談であり、完全な取引条件の提示と双方の合意までは申込みになりません。",
      ].join("\n");
      consultationLink.href = `mailto:kurabe.support@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      error.hidden = true;
      error.textContent = "";
    } catch (renderError) {
      error.textContent = renderError.message;
      error.hidden = false;
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  form.addEventListener("input", render);
  form.addEventListener("reset", () => globalObject.setTimeout(render, 0));
  render();
})(globalThis);
