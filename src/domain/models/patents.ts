/* eslint-disable @typescript-eslint/no-magic-numbers */
export const getPatent = (score: number) => {
  if (score < 3000) {
    return "<:recruta:1207351355593728061> Novato";
  } else if (score < 5000) {
    return "<:Taifeiro2Classe:1207358574972371045> Taifeiro 2ª Classe";
  } else if (score < 8000) {
    return "<:pointblank_img_patentes_2:1207363108868456459> Taifeiro 1ª Classe";
  } else if (score < 10000) {
    return "<:pointblank_img_patentes_3:1207363543096102973> Cabo";
  } else if (score < 15000) {
    return "<:pointblank_img_patentes_4:1207364733728985129> Sargento";
  } else if (score < 20000) {
    return "<:pointblank_img_patentes_5:1207365411583303691> Terceiro-Sargento 1";
  } else if (score < 25000) {
    return "<:pointblank_img_patentes_6:1207365812655104120> Terceiro-Sargento 2";
  } else if (score < 30000) {
    return "<:pointblank_img_patentes_7:1207366656070909993> Terceiro-Sargento 3";
  } else if (score < 34000) {
    return "<:pointblank_img_patentes_11:1207367221588926494> Segundo-Sargento";
  } else if (score < 38000) {
    return "<:pointblank_img_patentes_25:1207370238753247272> Primeiro-Tenente";
  } else if (score < 45000) {
    return "<:pointblank_img_patentes_30:1207369778122199041> Capitão";
  } else if (score < 60000) {
    return "<:pointblank_img_patentes_35:1207369973459329165> Major";
  } else if (score < 70000) {
    return "<:pointblank_img_patentes_46:1207372187309445140> General de Brigada";
  } else if (score < 75000) {
    return "<:pointblank_img_patentes_47:1207372354766770186> General de Divisão";
  } else if (score < 80000) {
    return "<:pointblank_img_patentes_48:1207372357493198898> General de Exército";
  } else if (score < 95000) {
    return "<:pointblank_img_patentes_49:1207372359519178822> Marechal";
  } else if (score < 100000) {
    return "<:pointblank_img_patentes_50:1207372361397968896> Herói de Guerra";
  } else if (score >= 100000) {
    return "<:pointblank_img_patentes_51:1207372363188932618> Lendário";
  }
};
