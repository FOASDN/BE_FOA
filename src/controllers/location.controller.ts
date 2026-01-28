function isInDaNang(lat, lng) {
  return (
    lat >= 15.9 &&
    lat <= 16.2 &&
    lng >= 107.9 &&
    lng <= 108.35
  );
}

exports.receiveLocation = (req, res) => {
  const { lat, lng } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({
      ok: false,
      message: "Thiếu tọa độ",
    });
  }

  const isValid = isInDaNang(lat, lng);

  return res.json({
    ok: true,
    lat,
    lng,
    isValid,
    area: isValid ? "Đà Nẵng" : "Ngoài Đà Nẵng",
    message: isValid
      ? "Vị trí hợp lệ (trong khu vực Đà Nẵng)"
      : "Vị trí không hợp lệ (ngoài khu vực Đà Nẵng)",
  });
};
