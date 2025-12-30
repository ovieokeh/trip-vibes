import React, { useState, useMemo } from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity } from "react-native";
import { CalendarList, DateData } from "react-native-calendars";
import { Colors } from "../../constants/Colors";
import { Button } from "./Button";
import { X } from "lucide-react-native";

interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (start: Date, end: Date) => void;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
}

export function DateRangePicker({
  visible,
  onClose,
  onSelect,
  initialStartDate,
  initialEndDate,
}: DateRangePickerProps) {
  const colors = Colors.light;
  const [startDate, setStartDate] = useState<string | null>(
    initialStartDate ? initialStartDate.toISOString().split("T")[0] : null
  );
  const [endDate, setEndDate] = useState<string | null>(
    initialEndDate ? initialEndDate.toISOString().split("T")[0] : null
  );

  const handleDayPress = (day: DateData) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (day.dateString < startDate) {
        setStartDate(day.dateString);
      } else {
        // limit to 14 days
        const start = new Date(startDate);
        const end = new Date(day.dateString);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 14) {
          // If range > 14 days, set end date to start + 13 days
          const newEnd = new Date(start);
          newEnd.setDate(start.getDate() + 13); // +13 because start date counts as day 1
          setEndDate(newEnd.toISOString().split("T")[0]);
          // Ideally show a toast here, but for now just clamp
        } else {
          setEndDate(day.dateString);
        }
      }
    }
  };

  const markedDates = useMemo(() => {
    const marks: any = {};
    if (startDate) {
      marks[startDate] = { startingDay: true, color: colors.primary, textColor: "white" };
    }
    if (endDate) {
      marks[endDate] = { endingDay: true, color: colors.primary, textColor: "white" };
    }
    if (startDate && endDate) {
      let current = new Date(startDate);
      const end = new Date(endDate);
      while (current <= end) {
        const dateString = current.toISOString().split("T")[0];
        if (dateString !== startDate && dateString !== endDate) {
          marks[dateString] = { color: colors.primary + "33", textColor: colors.foreground }; // 33 for ~20% opacity
        }
        current.setDate(current.getDate() + 1);
      }
    }
    return marks;
  }, [startDate, endDate, colors]);

  const handleConfirm = () => {
    if (startDate && endDate) {
      onSelect(new Date(startDate), new Date(endDate));
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Dates</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={colors.foreground} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={{ color: colors.mutedForeground, marginBottom: 10, textAlign: "center" }}>
            {startDate && endDate ? "Selected: " + startDate + " to " + endDate : "Select a date range (max 14 days)"}
          </Text>
          <Button title="Confirm Dates" onPress={handleConfirm} fullWidth disabled={!startDate || !endDate} />
        </View>

        <CalendarList
          markingType={"period"}
          markedDates={markedDates}
          onDayPress={handleDayPress}
          pastScrollRange={0}
          futureScrollRange={12}
          scrollEnabled={true}
          theme={{
            calendarBackground: colors.background,
            textSectionTitleColor: colors.mutedForeground,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: "#ffffff",
            todayTextColor: colors.primary,
            dayTextColor: colors.foreground,
            textDisabledColor: colors.mutedForeground + "66",
            dotColor: colors.primary,
            selectedDotColor: "#ffffff",
            arrowColor: colors.primary,
            monthTextColor: colors.foreground,
            indicatorColor: colors.primary,
            textDayFontWeight: "400",
            textMonthFontWeight: "bold",
            textDayHeaderFontWeight: "400",
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
});
