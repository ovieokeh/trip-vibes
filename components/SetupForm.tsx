"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { SmartCitySelect } from "./SmartCitySelect";
import { DateRangePicker } from "./DateRangePicker";

const setupSchema = z.object({
  cityId: z.string().min(1, "Please select a city"),
  startDate: z.string().min(1, "Please select a start date"),
  endDate: z.string().min(1, "Please select an end date"),
  budget: z.enum(["low", "medium", "high"]),
});

type SetupFormData = z.infer<typeof setupSchema>;

export default function SetupForm() {
  const router = useRouter();

  const {
    cityId: storeCityId,
    startDate: storeStart,
    endDate: storeEnd,
    budget: storeBudget,
    setCity,
    setDates,
    setBudget,
  } = useStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      cityId: storeCityId || "",
      startDate: storeStart || "",
      endDate: storeEnd || "",
      budget: storeBudget || "medium",
    },
  });

  const onSubmit = (data: SetupFormData) => {
    setCity(data.cityId);
    setDates(data.startDate, data.endDate);
    setBudget(data.budget);
    router.push("/vibes");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 w-full max-w-md mx-auto">
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold">Where are you going?</span>
        </label>
        <Controller
          name="cityId"
          control={control}
          render={({ field }) => <SmartCitySelect selectedCityId={field.value} onSelect={field.onChange} />}
        />
        {errors.cityId && <span className="text-error text-sm mt-1">{errors.cityId.message}</span>}
      </div>

      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold">When?</span>
        </label>
        <Controller
          name="startDate"
          control={control}
          render={({ field: startField }) => (
            <Controller
              name="endDate"
              control={control}
              render={({ field: endField }) => (
                <DateRangePicker
                  startDate={startField.value}
                  endDate={endField.value}
                  onChange={(start, end) => {
                    startField.onChange(start);
                    endField.onChange(end);
                  }}
                />
              )}
            />
          )}
        />
        {(errors.startDate || errors.endDate) && (
          <span className="text-error text-sm mt-1">{errors.startDate?.message || errors.endDate?.message}</span>
        )}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Budget Vibe</span>
        </label>
        <Controller
          name="budget"
          control={control}
          render={({ field }) => (
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  className={`btn flex-1 ${field.value === b ? "btn-neutral" : "btn-outline"}`}
                  onClick={() => field.onChange(b)}
                >
                  {b === "low" ? "$" : b === "medium" ? "$$" : "$$$"}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <button type="submit" className="btn btn-primary w-full mt-4 text-lg">
        Start Vibe Check
      </button>
    </form>
  );
}
