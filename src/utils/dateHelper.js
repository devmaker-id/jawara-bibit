// src/utils/dateHelper.js

const formatDate = (dateString, showTime = true) => {
  const date = new Date(dateString);

  const day = new Intl.DateTimeFormat("id-ID", { day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(date);
  const year = new Intl.DateTimeFormat("id-ID", { year: "numeric" }).format(date);
  
  let formattedDate = `${day}, ${month} ${year}`;

  if (showTime) {
    const time = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(date);

    formattedDate += ` ${time}`;
  }

  return formattedDate;
};

module.exports = { formatDate };
